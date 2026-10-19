import {createError,getHeader,readRawBody} from 'h3'
import Stripe from 'stripe'
import {adminDb} from '../../utils/media'
import {stripeClient} from '../../utils/payments'
export default defineEventHandler(async event=>{
 const secret=process.env.STRIPE_WEBHOOK_SECRET
 const signature=getHeader(event,'stripe-signature')
 if(!secret||!signature) throw createError({statusCode:400,statusMessage:'Webhook signature missing'})
 const raw=await readRawBody(event,false)
 if(!raw) throw createError({statusCode:400,statusMessage:'Empty webhook'})
 let stripeEvent:Stripe.Event
 try {stripeEvent=stripeClient().webhooks.constructEvent(raw,signature,secret)}
 catch {throw createError({statusCode:400,statusMessage:'Invalid webhook signature'})}
 if(stripeEvent.type!=='checkout.session.completed' && stripeEvent.type!=='checkout.session.async_payment_succeeded') return {received:true}
 const session=stripeEvent.data.object as Stripe.Checkout.Session
 if(session.mode!=='payment'||session.payment_status!=='paid') return {received:true}
 const meta=session.metadata||{}
 const eventId=meta.eventId||'',ownerId=meta.ownerId||'',planId=meta.planId||''
 const amount=Number(meta.amountCents),bytes=Number(meta.storageLimitBytes),days=Number(meta.retentionDays)
 const currency=(meta.currency||'').toUpperCase()
 if(!/^[0-9a-f-]{36}$/i.test(eventId)||!/^[0-9a-f-]{36}$/i.test(ownerId)||!/^[a-z0-9_-]{1,60}$/.test(planId)||!Number.isSafeInteger(bytes)||bytes<=0||!Number.isInteger(days)||days<=0||!Number.isSafeInteger(amount)||amount<=0||!currency.match(/^[A-Z]{3}$/)||session.amount_total!==amount||session.currency?.toUpperCase()!==currency||session.client_reference_id!==eventId) {
  throw createError({statusCode:400,statusMessage:'Invalid checkout metadata'})
 }
 const {error}=await adminDb().rpc('activate_event_package_payment',{
  p_session_id:session.id,p_payment_intent_id:typeof session.payment_intent==='string'?session.payment_intent:null,
  p_event_id:eventId,p_owner_id:ownerId,p_plan_id:planId,p_amount_cents:amount,p_currency:currency,
  p_storage_limit_bytes:bytes,p_retention_days:days
 })
 if(error){console.error('Payment activation failed',error.message);throw createError({statusCode:500,statusMessage:'Could not activate package'})}
 return {received:true}
})
