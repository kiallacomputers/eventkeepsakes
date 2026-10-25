import {createError,readBody,setHeader,sendStream} from 'h3'
import {Readable} from 'node:stream'
import archiver from 'archiver'
import {adminDb,ownerEvent,BUCKET} from '../../utils/media'
import {MAX_EXPORT_BYTES,MAX_EXPORT_FILES} from '../../utils/storage-plans'

const safeName=(name:string)=>name.normalize('NFKC').replace(/[^a-zA-Z0-9._ -]/g,'_').replace(/^\.+/,'_').slice(0,140)||'file'
export default defineEventHandler(async event => {
 const body=await readBody(event)
 const id=String(body?.eventId||'')
 const selected=body?.mediaIds
 if(selected!==undefined && (!Array.isArray(selected)||selected.length<1||selected.length>MAX_EXPORT_FILES||
    selected.some((x:unknown)=>typeof x!=='string'||!/^[0-9a-f-]{36}$/i.test(x))||
    new Set(selected).size!==selected.length))
  throw createError({statusCode:400,statusMessage:'Choose valid unique media files'})
 const owner=await ownerEvent(event,id)
 const db=adminDb()
 // Export originals, including rejected media, but never incomplete reservations.
 let query=db.from('event_media')
  .select('id,storage_path,original_name,size_bytes,status')
  .eq('event_id',id).neq('status','pending_upload').order('created_at',{ascending:true})
 if(selected)query=query.in('id',selected)
 // Fetch one extra record so complete-event export never silently truncates.
 const {data:media,error}=await query.limit(MAX_EXPORT_FILES+1)
 if(error) throw createError({statusCode:500,statusMessage:'Could not prepare event export'})
 if(selected && (media?.length!==selected.length))
  throw createError({statusCode:400,statusMessage:'Some selected media are no longer available'})
 if(!media?.length) throw createError({statusCode:400,statusMessage:'No completed uploads to export'})
 const total=media.reduce((n:number,m:any)=>n+Number(m.size_bytes),0)
 if(media.length>MAX_EXPORT_FILES||total>MAX_EXPORT_BYTES)
  throw createError({statusCode:413,statusMessage:'This event exceeds the current ZIP export safety limit. Contact support for a larger export.'})
 // Resolve and validate all source URLs before sending a ZIP response.
 const entries=[] as {name:string,url:string}[]
 for(let i=0;i<media.length;i++){
  const m=media[i]
  const {data,error:signError}=await db.storage.from(BUCKET).createSignedUrl(m.storage_path,900)
  if(signError||!data?.signedUrl) throw createError({statusCode:500,statusMessage:'Could not access an original file'})
  entries.push({name:`${String(i+1).padStart(4,'0')}-${safeName(m.original_name||m.id)}`,url:data.signedUrl})
 }
 const zip=archiver('zip',{zlib:{level:0}})
 zip.on('warning',err=>zip.destroy(err))
 // Only start the streaming response after the request has passed owner authentication.
 setHeader(event,'content-type','application/zip')
 setHeader(event,'content-disposition',`attachment; filename="eventkeepsakes-${safeName(owner.slug||id)}-originals.zip"`)
 setHeader(event,'cache-control','private, no-store')
 void (async()=>{
  try{
   for(const entry of entries){
    const response=await fetch(entry.url)
    if(!response.ok||!response.body) throw new Error('Could not stream original media')
    zip.append(Readable.fromWeb(response.body as any),{name:entry.name})
   }
   await zip.finalize()
  }catch(err){zip.destroy(err as Error)}
 })()
 return sendStream(event,zip)
})
