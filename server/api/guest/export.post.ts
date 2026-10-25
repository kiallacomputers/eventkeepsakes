import {createError,readBody,setHeader,sendStream} from 'h3'
import {Readable} from 'node:stream'
import archiver from 'archiver'
import {adminDb,eventBySlug,requireGuest,BUCKET} from '../../utils/media'
import {MAX_EXPORT_BYTES,MAX_EXPORT_FILES} from '../../utils/storage-plans'
const safeName=(name:string)=>name.normalize('NFKC').replace(/[^a-zA-Z0-9._ -]/g,'_').replace(/^\.+/,'_').slice(0,140)||'memory'
export default defineEventHandler(async event=>{
 const b=await readBody(event)
 const slug=String(b?.slug||'')
 const ids=b?.mediaIds
 if(!Array.isArray(ids)||!ids.length||ids.length>Math.min(MAX_EXPORT_FILES,100)||
    ids.some((x:unknown)=>typeof x!=='string'||!/^[0-9a-f-]{36}$/i.test(x))||new Set(ids).size!==ids.length)
  throw createError({statusCode:400,statusMessage:'Choose up to 100 unique memories'})
 const row=await eventBySlug(slug)
 await requireGuest(event,row)
 if(row.gallery_visibility!=='shared'||!row.guest_downloads_enabled)
  throw createError({statusCode:403,statusMessage:'Guest downloads are disabled'})
 const db=adminDb()
 const {data:media,error}=await db.from('event_media')
  .select('id,storage_path,original_name,size_bytes')
  .eq('event_id',row.id).eq('status','approved').in('id',ids).limit(ids.length+1)
 if(error)throw createError({statusCode:500,statusMessage:'Could not prepare selected memories'})
 if(media?.length!==ids.length)throw createError({statusCode:400,statusMessage:'Some memories are no longer available'})
 const total=media.reduce((n,m)=>n+Number(m.size_bytes||0),0)
 if(total>MAX_EXPORT_BYTES)throw createError({statusCode:413,statusMessage:'Selected files exceed the ZIP download limit. Select fewer memories.'})
 const entries:{name:string;url:string}[]=[]
 for(let i=0;i<media.length;i++){
  const m=media[i]
  const {data,error}=await db.storage.from(BUCKET).createSignedUrl(m.storage_path,900)
  if(error||!data?.signedUrl)throw createError({statusCode:500,statusMessage:'A selected original is unavailable'})
  entries.push({name:`${String(i+1).padStart(4,'0')}-${safeName(m.original_name||m.id)}`,url:data.signedUrl})
 }
 const zip=archiver('zip',{zlib:{level:0}})
 zip.on('warning',err=>zip.destroy(err))
 setHeader(event,'content-type','application/zip')
 setHeader(event,'content-disposition','attachment; filename="eventkeepsakes-selected-memories.zip"')
 setHeader(event,'cache-control','private, no-store')
 void (async()=>{try{
  for(const entry of entries){
   const response=await fetch(entry.url)
   if(!response.ok||!response.body)throw new Error('Could not stream original media')
   zip.append(Readable.fromWeb(response.body as any),{name:entry.name})
  }
  await zip.finalize()
 }catch(e){zip.destroy(e as Error)}})()
 return sendStream(event,zip)
})
