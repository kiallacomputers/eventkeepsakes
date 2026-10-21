import {readBody,createError} from 'h3'
import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
const fields=['usd_to_aud','supabase_usd_month','railway_usd_month','railway_included_gb','railway_overage_usd_gb','domain_aud_year','other_aud_month','variable_aud_event','stripe_percent','stripe_fixed_aud','annual_event_target'] as const
export default defineEventHandler(async event=>{
 await requirePackageAdmin(event)
 const body=await readBody(event),row:any={updated_at:new Date().toISOString()}
 for(const field of fields){const value=Number(body?.[field]);if(!Number.isFinite(value)||value<0||value>10000000)throw createError({statusCode:400,statusMessage:`Invalid ${field}`});row[field]=value}
 if(row.usd_to_aud<=0||row.railway_included_gb<=0||row.stripe_percent>100||!Number.isInteger(row.annual_event_target)||row.annual_event_target<1)throw createError({statusCode:400,statusMessage:'Invalid financial settings'})
 row.gst_registered=body?.gst_registered===true
 const {data,error}=await adminDb().from('event_finance_settings').update(row).eq('id',1).select().single()
 if(error)throw createError({statusCode:500,statusMessage:'Could not save financial settings'})
 return {settings:data}
})
