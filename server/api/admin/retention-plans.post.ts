import {readBody,createError} from 'h3'
import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
export default defineEventHandler(async event=>{
 await requirePackageAdmin(event)
 const b=await readBody(event)
 const id=String(b?.id||''),name=String(b?.display_name||'').trim(),days=Number(b?.extension_days)
 const price=Number(b?.price_cents),currency=String(b?.currency||'AUD').toUpperCase(),order=Number(b?.sort_order)
 if(!/^[a-z0-9_-]{1,60}$/.test(id)||!name||name.length>100||!Number.isInteger(days)||days<1||days>3650||
 !Number.isInteger(price)||price<1||price>100000000||!/^[A-Z]{3}$/.test(currency)||!Number.isInteger(order)||order<0||order>100000)
 throw createError({statusCode:400,statusMessage:'Check plan ID, name, days, price, currency and display order'})
 const {error}=await adminDb().from('event_retention_extension_plans').upsert({
 id,display_name:name,extension_days:days,price_cents:price,currency,sort_order:order,active:b.active===true,updated_at:new Date().toISOString()
 },{onConflict:'id'})
 if(error)throw createError({statusCode:500,statusMessage:'Unable to save extension option'})
 return {saved:true}
})
