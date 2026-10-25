import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
import {createError} from 'h3'
export default defineEventHandler(async event=>{
 await requirePackageAdmin(event)
 const {data,error}=await adminDb().from('event_retention_extension_plans').select('*').order('sort_order')
 if(error)throw createError({statusCode:500,statusMessage:'Unable to load retention prices'})
 return {plans:data||[]}
})
