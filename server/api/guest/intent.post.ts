import {readBody,createError} from 'h3'
import {adminDb,eventBySlug,requireGuest,assertOpen,MIME,MAX_IMAGE,MAX_VIDEO,BUCKET,randomUUID} from '../../utils/media'
export default defineEventHandler(async(event)=>{
 const b=await readBody(event)
 const row=await eventBySlug(String(b?.slug||''))
 await requireGuest(event,row);assertOpen(row)
 const name=String(b?.name||'').trim().slice(0,120)
 if(row.guest_name_mode==='required'&&!name)throw createError({statusCode:400,statusMessage:'Your name is required'})
 const mime=String(b?.mime||'');const kind=MIME[mime]
 const size=Number(b?.size)
 if(!kind||!Number.isSafeInteger(size)||size<1||size>(kind==='image'?MAX_IMAGE:MAX_VIDEO))
  throw createError({statusCode:400,statusMessage:'Unsupported file type or file size'})
 const id=randomUUID(),path=`${row.id}/${id}`,db=adminDb()
 const {error:reserveError}=await db.rpc('reserve_event_media',{
  p_id:id,p_event_id:row.id,p_storage_path:path,
  p_original_name:String(b?.filename||'upload').slice(0,200),
  p_mime_type:mime,p_size_bytes:size,p_media_type:kind,
  p_contributor_name:row.guest_name_mode==='disabled'?null:(name||null)
 })
 if(reserveError){
  const msg=reserveError.message||''
  if(msg.includes('Event storage limit reached'))throw createError({statusCode:413,statusMessage:'This event has reached its storage limit. Please contact the event organiser.'})
  if(msg.includes('Event storage has expired'))throw createError({statusCode:403,statusMessage:'Event storage has expired'})
  throw createError({statusCode:500,statusMessage:'Could not reserve upload'})
 }
 const {data:signed,error:signErr}=await db.storage.from(BUCKET).createSignedUploadUrl(path)
 if(signErr||!signed){
  // Safe: no upload token was issued; reservation can be released.
  await db.from('event_media').delete().eq('id',id).eq('event_id',row.id).eq('status','pending_upload')
  throw createError({statusCode:500,statusMessage:'Could not authorise upload'})
 }
 return {id,path,token:signed.token}
})
