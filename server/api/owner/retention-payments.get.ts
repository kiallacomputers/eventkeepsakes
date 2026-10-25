import {getQuery,createError} from 'h3'
import {ownerEvent,adminDb} from '../../utils/media'
export default defineEventHandler(async event=>{
 const id=String(getQuery(event).id||'')
 if(!/^[0-9a-f-]{36}$/i.test(id))throw createError({statusCode:400,statusMessage:'Invalid event'})
 await ownerEvent(event,id)
 const {data,error}=await adminDb().from('event_retention_extension_payments')
 .select('id,extension_plan_id,extension_days,amount_cents,currency,paid_at,new_expiry')
 .eq('event_id',id).order('paid_at',{ascending:false}).limit(50)
 if(error)throw createError({statusCode:500,statusMessage:'Unable to load extension payments'})
 return {payments:data||[]}
})
