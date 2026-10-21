import {createError} from 'h3'
import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
import {getRetentionSettings} from '../../utils/retention'
export default defineEventHandler(async event=>{
 const actor=await requirePackageAdmin(event)
 const db=adminDb()
 const settings=await getRetentionSettings()
 const {data,error}=await db.from('event_storage_entitlements')
  .select('event_id,expires_at,status').not('expires_at','is',null).order('expires_at').limit(1000)
 if(error) throw createError({statusCode:500,statusMessage:'Unable to scan events'})
 let queued=0
 const today=new Date().toISOString().slice(0,10)
 if(settings.reminders_enabled) for(const item of data||[]){
  if(item.status!=='active') continue
  const expiry=Date.parse(item.expires_at)
  if(!Number.isFinite(expiry)||expiry<=Date.now()) continue
  const days=Math.ceil((expiry-Date.now())/86400000)
  if(!settings.reminder_days.includes(days)) continue
  const {error:queueError}=await db.from('event_retention_reminders').upsert({
   event_id:item.event_id,expiry_at:item.expires_at,days_before:days,status:'pending'
  },{onConflict:'event_id,expiry_at,days_before',ignoreDuplicates:true})
  if(queueError) throw createError({statusCode:500,statusMessage:'Failed to queue a reminder'})
  queued++
 }
 await db.from('event_retention_audit').insert({action:'manual_scan',details:{actor,checked:(data||[]).length,queued,day:today}})
 return {checked:(data||[]).length,queued,note:'Scan complete. No emails were sent and no files were deleted.'}
})
