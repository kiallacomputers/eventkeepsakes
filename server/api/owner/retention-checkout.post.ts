import {readBody,createError} from 'h3'
import {randomUUID} from 'node:crypto'
import {adminDb,ownerEvent} from '../../utils/media'
import {paymentOrigin,stripeClient} from '../../utils/payments'
export default defineEventHandler(async event=>{
 const b=await readBody(event)
 const eventId=String(b?.eventId||''),planId=String(b?.planId||'')
 if(!/^[0-9a-f-]{36}$/i.test(eventId)||!/^[a-z0-9_-]{1,60}$/.test(planId))
  throw createError({statusCode:400,statusMessage:'Invalid event or extension'})
 const owned=await ownerEvent(event,eventId)
 const db=adminDb()
 const [{data:plan,error:pe},{data:entitlement,error:ee}]=await Promise.all([
  db.from('event_retention_extension_plans').select('*').eq('id',planId).eq('active',true).maybeSingle(),
  db.from('event_storage_entitlements').select('event_id,expires_at').eq('event_id',eventId).maybeSingle()
 ])
 if(pe||!plan||!Number.isInteger(plan.price_cents)||plan.price_cents<=0||
 !Number.isInteger(plan.extension_days)||plan.extension_days<1||plan.extension_days>3650||!/^[A-Z]{3}$/.test(plan.currency))
  throw createError({statusCode:400,statusMessage:'Extension is not available'})
 if(ee||!entitlement)throw createError({statusCode:400,statusMessage:'Purchase a storage package before extending retention'})
 const origin=paymentOrigin(event)
 const session=await stripeClient().checkout.sessions.create({
  mode:'payment',payment_method_types:['card'],client_reference_id:eventId,
  line_items:[{price_data:{currency:plan.currency.toLowerCase(),unit_amount:plan.price_cents,
   product_data:{name:`EventKeepsakes — ${plan.display_name}`,description:`Extend existing event retention by ${plan.extension_days} days; storage capacity unchanged.`}},quantity:1}],
  metadata:{kind:'retention_extension',eventId,ownerId:owned.owner_id,extensionPlanId:plan.id,
   extensionDays:String(plan.extension_days),amountCents:String(plan.price_cents),currency:plan.currency},
  success_url:`${origin}/dashboard/events/${encodeURIComponent(eventId)}/packages?retention=success`,
  cancel_url:`${origin}/dashboard/events/${encodeURIComponent(eventId)}/packages?retention=cancelled`
 },{idempotencyKey:`ek-retention-${eventId}-${planId}-${randomUUID()}`})
 if(!session.url)throw createError({statusCode:502,statusMessage:'Stripe checkout unavailable'})
 return {url:session.url}
})
