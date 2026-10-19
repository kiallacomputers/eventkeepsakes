import {readBody,createError} from 'h3'
import {randomUUID} from 'node:crypto'
import {adminDb,ownerEvent} from '../../utils/media'
import {stripeClient,paymentOrigin} from '../../utils/payments'
export default defineEventHandler(async event=>{
 const body=await readBody(event)
 const eventId=String(body?.eventId||''),planId=String(body?.planId||'')
 if(!/^[0-9a-f-]{36}$/i.test(eventId)||!/^[a-z0-9_-]{1,60}$/.test(planId)) throw createError({statusCode:400,statusMessage:'Invalid event or package'})
 const owned=await ownerEvent(event,eventId)
 const {data:plan,error}=await adminDb().from('event_storage_plans').select('*').eq('id',planId).eq('active',true).maybeSingle()
 if(error||!plan||plan.price_cents<=0||!plan.retention_days||!plan.storage_limit_bytes||!/^[A-Z]{3}$/.test(plan.currency)) throw createError({statusCode:400,statusMessage:'Package is not available for purchase'})
 // Prevent paid downgrades. Package changes are full-price purchases; no proration.
 const {data:current}=await adminDb().from('event_storage_entitlements').select('storage_limit_bytes').eq('event_id',eventId).maybeSingle()
 if(current && Number(plan.storage_limit_bytes)<Number(current.storage_limit_bytes)) throw createError({statusCode:400,statusMessage:'You cannot purchase a smaller storage package for this event'})
 const origin=paymentOrigin(event)
 const stripe=stripeClient()
 const session=await stripe.checkout.sessions.create({
  mode:'payment',payment_method_types:['card'],client_reference_id:eventId,
  line_items:[{price_data:{currency:plan.currency.toLowerCase(),unit_amount:plan.price_cents,product_data:{name:`EventKeepsakes — ${plan.display_name}`,description:`${(Number(plan.storage_limit_bytes)/1073741824).toFixed(1)} GB storage · ${plan.retention_days} days retention`}},quantity:1}],
  metadata:{eventId,ownerId:owned.owner_id,planId:plan.id,storageLimitBytes:String(plan.storage_limit_bytes),retentionDays:String(plan.retention_days),amountCents:String(plan.price_cents),currency:plan.currency},
  success_url:`${origin}/dashboard/events/${encodeURIComponent(eventId)}/packages?checkout=success`,
  cancel_url:`${origin}/dashboard/events/${encodeURIComponent(eventId)}/packages?checkout=cancelled`
 },{idempotencyKey:`ek-checkout-${eventId}-${planId}-${randomUUID()}`})
 if(!session.url) throw createError({statusCode:502,statusMessage:'Stripe checkout URL unavailable'})
 return {url:session.url}
})
