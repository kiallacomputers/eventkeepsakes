import {readBody,createError} from 'h3'
import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
export default defineEventHandler(async event=>{
 const actor=await requirePackageAdmin(event)
 const body=await readBody(event)
 const days=body?.reminder_days
 const recovery=body?.recovery_days
 if(!Array.isArray(days)||days.length<1||days.length>10||!days.every((d:any)=>Number.isInteger(d)&&d>=1&&d<=365)
 ||!Number.isInteger(recovery)||recovery<1||recovery>365)
  throw createError({statusCode:400,statusMessage:'Enter valid reminder days (1–365) and recovery days (1–365).'})
 if(body?.automatic_deletion_enabled) throw createError({statusCode:400,statusMessage:'Automatic deletion is disabled for safety.'})
 const db=adminDb()
 const {data,error}=await db.from('event_retention_settings').update({
  reminder_days:[...new Set(days)].sort((a:number,b:number)=>b-a),
  recovery_days:recovery,reminders_enabled:body.reminders_enabled===true,
  automatic_deletion_enabled:false,updated_at:new Date().toISOString()
 }).eq('id',1).select().single()
 if(error) throw createError({statusCode:500,statusMessage:'Unable to save retention settings'})
 await db.from('event_retention_audit').insert({action:'settings_updated',details:{actor,reminder_days:data.reminder_days,recovery_days:recovery,reminders_enabled:data.reminders_enabled}})
 return {settings:data}
})
