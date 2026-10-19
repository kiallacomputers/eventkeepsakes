import {readBody,createError} from 'h3'
import {adminDb,eventBySlug,requireGuest,assertOpen,MIME,MAX_IMAGE,MAX_VIDEO,QUOTA,BUCKET,randomUUID} from '../../utils/media'
export default defineEventHandler(async(event)=>{
 const b=await readBody(event)
 const row=await eventBySlug(String(b?.slug||''))
 await requireGuest(event,row);assertOpen(row)
 const name=String(b?.name||'').trim().slice(0,120)
 if(row.guest_name_mode==='required'&&!name) throw createError({statusCode:400,statusMessage:'Your name is required'})
 const mime=String(b?.mime||'');const kind=MIME[mime]
 const size=Number(b?.size)
 if(!kind || !Number.isSafeInteger(size) || size<1 || size>(kind==='image'?MAX_IMAGE:MAX_VIDEO)) throw createError({statusCode:400,statusMessage:'Unsupported file type or file size'})
 const db=adminDb()
 const {data:existing,error:quotaErr}=await db.from('event_media').select('size_bytes').eq('event_id',row.id).neq('status','rejected')
 if(quotaErr) throw createError({statusCode:500,statusMessage:'Storage quota unavailable'})
 const used=(existing||[]).reduce((n:number,x:any)=>n+Number(x.size_bytes),0)
 if(used+size>QUOTA) throw createError({statusCode:413,statusMessage:'Event storage limit reached (500 MB)'})
 const id=randomUUID()
 const path=`${row.id}/${id}`
 const {error:insertError}=await db.from('event_media').insert({id,event_id:row.id,storage_path:path,original_name:String(b?.filename||'upload').slice(0,200),mime_type:mime,size_bytes:size,media_type:kind,contributor_name:row.guest_name_mode==='disabled'?null:(name||null),status:'pending_upload'})
 if(insertError) throw createError({statusCode:500,statusMessage:'Could not reserve upload'})
 const {data:signed,error:signErr}=await db.storage.from(BUCKET).createSignedUploadUrl(path)
 if(signErr||!signed){await db.from('event_media').delete().eq('id',id);throw createError({statusCode:500,statusMessage:'Could not authorise upload'})}
 return {id,path,token:signed.token}
})
