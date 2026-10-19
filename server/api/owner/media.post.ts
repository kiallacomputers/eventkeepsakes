import {readBody,createError} from 'h3'
import {adminDb,ownerEvent,BUCKET} from '../../utils/media'
export default defineEventHandler(async(event)=>{
 const b=await readBody(event)
 const id=String(b?.eventId||'')
 await ownerEvent(event,id)
 const action=String(b?.action||'')
 if(!['approve','reject','delete'].includes(action)) throw createError({statusCode:400,statusMessage:'Invalid action'})
 const db=adminDb()
 const {data:media}=await db.from('event_media').select('*').eq('id',String(b?.mediaId||'')).eq('event_id',id).maybeSingle()
 if(!media) throw createError({statusCode:404,statusMessage:'Media not found'})
 if(action==='delete'){
  const {error:storageError}=await db.storage.from(BUCKET).remove([media.storage_path])
  if(storageError) throw createError({statusCode:500,statusMessage:'Could not delete stored file'})
  const {error}=await db.from('event_media').delete().eq('id',media.id)
  if(error) throw createError({statusCode:500,statusMessage:'Could not delete record'})
 }else{
  const {error}=await db.from('event_media').update({status:action==='approve'?'approved':'rejected'}).eq('id',media.id)
  if(error) throw createError({statusCode:500,statusMessage:'Could not update status'})
 }
 return {ok:true}
})
