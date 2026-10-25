import {requireManager} from '../../utils/payments'
import {adminDb} from '../../utils/media'
import {getRetentionSettings,retentionPhase} from '../../utils/retention'
import {createError} from 'h3'
export default defineEventHandler(async event=>{
 await requireManager(event)
 const db=adminDb()
 const settings=await getRetentionSettings()
 const {data:entitlements,error}=await db.from('event_storage_entitlements')
  .select('event_id,storage_limit_bytes,status,expires_at').order('expires_at',{ascending:true}).limit(200)
 if(error) throw createError({statusCode:500,statusMessage:'Unable to load event retention records'})
 const ids=(entitlements||[]).map(e=>e.event_id)
 let names=new Map<string,string>()
 if(ids.length){
  const {data:events,error:eventError}=await db.from('events').select('id,title').in('id',ids)
  if(eventError) throw createError({statusCode:500,statusMessage:'Unable to load event names'})
  names=new Map((events||[]).map(e=>[e.id,e.title]))
 }
 const {data:audits}=await db.from('event_retention_audit').select('id,event_id,action,created_at').order('created_at',{ascending:false}).limit(30)
 const {data:reminders}=await db.from('event_retention_reminders').select('id,event_id,days_before,expiry_at,status').order('created_at',{ascending:false}).limit(30)
 return {settings,events:(entitlements||[]).map(e=>({...e,title:names.get(e.event_id)||'Untitled event',...retentionPhase(e.expires_at,e.status,settings.recovery_days)})),audits:audits||[],reminders:reminders||[]}
})
