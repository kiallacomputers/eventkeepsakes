import {getQuery,createError} from 'h3'
import {ownerEvent,adminDb} from '../../utils/media'
export default defineEventHandler(async event=>{
 const id=String(getQuery(event).id||'')
 if(!/^[0-9a-f-]{36}$/i.test(id)) throw createError({statusCode:400,statusMessage:'Invalid event ID'})
 await ownerEvent(event,id)
 const {data,error}=await adminDb().from('event_package_payments').select('id,plan_id,amount_cents,currency,paid_at').eq('event_id',id).order('paid_at',{ascending:false}).limit(25)
 if(error) throw createError({statusCode:500,statusMessage:'Could not load payment history'})
 return {payments:data||[]}
})
