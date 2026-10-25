import {createError} from 'h3'
import {adminDb} from '../../utils/media'
export default defineEventHandler(async()=>{
 const {data,error}=await adminDb().from('event_retention_extension_plans')
 .select('id,display_name,extension_days,price_cents,currency')
 .eq('active',true).order('sort_order')
 if(error)throw createError({statusCode:500,statusMessage:'Unable to load extension options'})
 return {plans:data||[]}
})
