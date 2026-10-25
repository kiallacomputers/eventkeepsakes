import {createError,readBody} from 'h3'
import {requireStaff} from '../../../utils/payments'
import {adminDb} from '../../../utils/media'
export default defineEventHandler(async event=>{
 const {userId}=await requireStaff(event)
 const body=await readBody(event)
 const id=String(body?.eventId||''),note=String(body?.note||'').trim()
 if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)||note.length<1||note.length>2000)
  throw createError({statusCode:400,statusMessage:'Valid event and note (1–2000 characters) required'})
 const db=adminDb()
 const {data:exists,error:lookupError}=await db.from('events').select('id').eq('id',id).maybeSingle()
 if(lookupError)throw createError({statusCode:500,statusMessage:'Unable to check event'})
 if(!exists)throw createError({statusCode:404,statusMessage:'Event not found'})
 const {error}=await db.from('event_support_notes').insert({event_id:id,staff_user_id:userId,note})
 if(error)throw createError({statusCode:500,statusMessage:'Could not save support note'})
 return {ok:true}
})
