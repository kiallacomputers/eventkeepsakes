import {readBody,createError} from 'h3'
import {adminDb,eventBySlug,requireGuest,assertOpen,BUCKET} from '../../utils/media'
export default defineEventHandler(async(event)=>{
 const b=await readBody(event)
 const row=await eventBySlug(String(b?.slug||''))
 await requireGuest(event,row);assertOpen(row)
 const db=adminDb()
 const {data:media}=await db.from('event_media').select('*').eq('id',String(b?.id||'')).eq('event_id',row.id).eq('status','pending_upload').maybeSingle()
 if(!media) throw createError({statusCode:404,statusMessage:'Upload reservation not found'})
 // Verify the object exists, and actual size/type match the reservation.
 const {data:objects,error:listErr}=await db.storage.from(BUCKET).list(row.id,{search:media.id,limit:10})
 const obj=objects?.find((o:any)=>o.name===media.id)
 if(listErr||!obj) throw createError({statusCode:400,statusMessage:'File upload not found'})
 const actualSize=Number(obj.metadata?.size)
 const actualMime=String(obj.metadata?.mimetype||'')
 if(actualSize!==Number(media.size_bytes)||actualMime!==media.mime_type){
  await db.storage.from(BUCKET).remove([media.storage_path])
  await db.from('event_media').delete().eq('id',media.id)
  throw createError({statusCode:400,statusMessage:'Uploaded file did not match reservation'})
 }
 const status=row.moderation_enabled?'pending':'approved'
 const {error}=await db.from('event_media').update({status,uploaded_at:new Date().toISOString()}).eq('id',media.id).eq('status','pending_upload')
 if(error) throw createError({statusCode:500,statusMessage:'Could not complete upload'})
 return {ok:true,status}
})
