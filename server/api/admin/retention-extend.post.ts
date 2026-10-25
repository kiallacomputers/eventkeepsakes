import {createError,readBody} from 'h3'
import {requireManager} from '../../utils/payments'
import {adminDb} from '../../utils/media'
export default defineEventHandler(async event=>{
 const actor=await requireManager(event)
 const body=await readBody(event)
 const id=String(body?.eventId||'')
 const days=Number(body?.days)
 if(!/^[0-9a-f-]{36}$/i.test(id)||!Number.isInteger(days)||days<1||days>3650)
  throw createError({statusCode:400,statusMessage:'Valid event and 1–3650 days required'})
 const db=adminDb()
 const {data,error}=await db.rpc('admin_extend_event_retention',{p_event_id:id,p_days:days,p_actor:actor})
 if(error) throw createError({statusCode:400,statusMessage:'Extension failed: '+error.message})
 return {expiresAt:data}
})
