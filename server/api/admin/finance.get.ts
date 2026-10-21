import {createError} from 'h3'
import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
import {financeSettings,audFromCents} from '../../utils/finance'
export default defineEventHandler(async event=>{
 await requirePackageAdmin(event)
 const db=adminDb(), settings=await financeSettings()
 // Read paid records only; never infer revenue from checkout sessions or package prices.
 const {data:payments,error}=await db.from('event_package_payments')
  .select('id,event_id,plan_id,amount_cents,currency,paid_at')
  .order('paid_at',{ascending:false}).limit(10000)
 if(error)throw createError({statusCode:500,statusMessage:'Could not load paid transactions'})
 const now=new Date(),year=now.getUTCFullYear(),rate=Number(settings.usd_to_aud)
 const annual=(payments||[]).filter(p=>p.paid_at&&new Date(p.paid_at).getUTCFullYear()===year)
 const converted=annual.map(p=>({...p,aud:audFromCents(Number(p.amount_cents),String(p.currency),rate)}))
 const recognized=converted.filter(p=>p.aud!==null)
 const excluded=converted.filter(p=>p.aud===null)
 const revenue=recognized.reduce((s,p)=>s+Number(p.aud),0)
 const stripeFees=recognized.reduce((s,p)=>s+Number(p.aud)*Number(settings.stripe_percent)/100+Number(settings.stripe_fixed_aud),0)
 const sales=recognized.length
 const fixedYear=12*(Number(settings.supabase_usd_month)+Number(settings.railway_usd_month))*rate+Number(settings.domain_aud_year)+12*Number(settings.other_aud_month)
 const variable=sales*Number(settings.variable_aud_event)
 const gst= settings.gst_registered ? revenue/11 : 0 // indicative GST-inclusive model, not a BAS calculation
 const contribution=revenue-stripeFees-variable-gst
 const profit=contribution-fixedYear
 const avgContribution=sales?contribution/sales:0
 const breakEven=avgContribution>0?Math.floor(fixedYear/avgContribution)+1:null
 const months=Array.from({length:12},(_,i)=>{
  const list=recognized.filter(p=>new Date(p.paid_at).getUTCMonth()===i)
  return {month:new Date(Date.UTC(year,i,1)).toLocaleString('en-AU',{month:'short',timeZone:'UTC'}),events:list.length,revenue:list.reduce((s,p)=>s+Number(p.aud),0)}
 })
 const byPlan=Object.values(recognized.reduce((acc:Record<string,{planId:string,sales:number,revenue:number}>,p)=>{
  const k=p.plan_id||'unknown';acc[k]??={planId:k,sales:0,revenue:0};acc[k].sales++;acc[k].revenue+=Number(p.aud);return acc
 },{}))
 // Storage usage is deliberately not inferred from purchased quotas.
 return {settings,year,summary:{revenue,sales,stripeFees,variable,gst,fixedYear,profit,breakEven,avgContribution,excludedCurrencies:excluded.length,hasMorePayments:(payments||[]).length===10000},months,byPlan,notes:['Payment fees are estimates based on editable settings, not reconciled Stripe fees.','Refunds, chargebacks and taxes are not reconciled in this report.','Storage overage is not included until actual Railway usage is connected.','Revenue covers only the first 10,000 fetched payment rows.']}
})
