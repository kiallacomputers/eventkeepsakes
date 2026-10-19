import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
import {createError} from 'h3'
export default defineEventHandler(async event=>{
 await requirePackageAdmin(event)
 const {data,error}=await adminDb().from('event_storage_plans').select('id,display_name,storage_limit_bytes,retention_days,price_cents,currency,active,sort_order').order('sort_order')
 if(error) throw createError({statusCode:500,statusMessage:'Could not load package administration'})
 return {plans:data||[]}
})
