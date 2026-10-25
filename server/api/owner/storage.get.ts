import {getQuery,createError} from 'h3'
import {ownerEvent,adminDb} from '../../utils/media'
import {storageEntitlement,storageUsage,MAX_EXPORT_BYTES,MAX_EXPORT_FILES} from '../../utils/storage-plans'
export default defineEventHandler(async event => {
 const query=getQuery(event)
 const id=String(query.id||query.eventId||'')
 if(!/^[0-9a-f-]{36}$/i.test(id)) throw createError({statusCode:400,statusMessage:'Invalid event ID'})
 await ownerEvent(event,id)
 const [entitlement,usage]=await Promise.all([storageEntitlement(id),storageUsage(id)])
 // A purchase is not proof of activation. Show the paid package only when
 // the active entitlement matches the payment's granted capacity.
 const db=adminDb()
 const {data:payments,error:paymentsError}=await db.from('event_package_payments')
  .select('plan_id,paid_at').eq('event_id',id).order('paid_at',{ascending:false}).limit(25)
 if(paymentsError) throw createError({statusCode:500,statusMessage:'Could not verify event package'})
 let packageName='Starter',packageId:null|string=null,activationWarning=false
 if(payments?.length){
  const ids=[...new Set(payments.map(p=>p.plan_id))]
  const {data:plans,error:plansError}=await db.from('event_storage_plans')
   .select('id,display_name,storage_limit_bytes').in('id',ids)
  if(plansError) throw createError({statusCode:500,statusMessage:'Could not load package details'})
  const matched=payments.find(p=>plans?.some(plan=>plan.id===p.plan_id && Number(plan.storage_limit_bytes)===entitlement.limitBytes))
  if(matched){packageId=matched.plan_id;packageName=plans!.find(plan=>plan.id===matched.plan_id)!.display_name}
  else activationWarning=true
 }
 // Existing usedBytes includes pending upload reservations for quota accounting.
 const {data:pendingReservations,error:reservationError}=await db.from('event_media')
  .select('size_bytes').eq('event_id',id).eq('status','pending_upload')
 if(reservationError)throw createError({statusCode:500,statusMessage:'Could not load upload reservations'})
 const reservedBytes=(pendingReservations||[]).reduce((sum:number,row:any)=>sum+Number(row.size_bytes||0),0)
 return {...entitlement,...usage,packageName,packageId,activationWarning,
  reservedBytes,availableBytes:Math.max(0,entitlement.limitBytes-usage.usedBytes),
  remainingBytes:Math.max(0,entitlement.limitBytes-usage.usedBytes),
  exportLimits:{maxFiles:MAX_EXPORT_FILES,maxBytes:MAX_EXPORT_BYTES}}
})
