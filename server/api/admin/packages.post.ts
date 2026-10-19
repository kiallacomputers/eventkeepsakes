import {readBody,createError} from 'h3'
import {adminDb} from '../../utils/media'
import {requirePackageAdmin} from '../../utils/payments'
export default defineEventHandler(async event=>{
 await requirePackageAdmin(event)
 const b=await readBody(event)
 const id=String(b?.id||'').trim(),display_name=String(b?.display_name||'').trim(),currency=String(b?.currency||'AUD').trim().toUpperCase()
 const storage_limit_bytes=Number(b?.storage_limit_bytes),retention_days=b?.retention_days===null?null:Number(b?.retention_days),price_cents=Number(b?.price_cents),sort_order=Number(b?.sort_order)
 if(!/^[a-z0-9_-]{1,60}$/.test(id)||!display_name||display_name.length>100||!/^[A-Z]{3}$/.test(currency)||!Number.isSafeInteger(storage_limit_bytes)||storage_limit_bytes<1048576||!Number.isSafeInteger(price_cents)||price_cents<0||price_cents>100000000||!Number.isInteger(sort_order)||sort_order<0||sort_order>100000||!(retention_days===null||(Number.isInteger(retention_days)&&retention_days>0&&retention_days<=36500))) throw createError({statusCode:400,statusMessage:'Invalid package fields'})
 if(price_cents>0 && retention_days===null) throw createError({statusCode:400,statusMessage:'Paid packages require a retention period'})
 const {error}=await adminDb().from('event_storage_plans').upsert({id,display_name,storage_limit_bytes,retention_days,price_cents,currency,sort_order,active:b?.active===true},{onConflict:'id'})
 if(error) throw createError({statusCode:500,statusMessage:'Could not save package'})
 return {ok:true}
})
