import {createError,getQuery} from 'h3'
import {requireStaff} from '../../../utils/payments'
import {adminDb} from '../../../utils/media'
import {storageUsage} from '../../../utils/storage-plans'

const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
type Check={key:string;level:'ok'|'warning'|'blocked'|'info';title:string;detail:string;action:string;target:'edit'|'retention'|'none'}
export default defineEventHandler(async event=>{
 const {role}=await requireStaff(event)
 const id=String(getQuery(event).id||'')
 if(!uuid.test(id))throw createError({statusCode:400,statusMessage:'Invalid event ID'})
 const db=adminDb()
 const [{data:e,error:evErr},{data:ent,error:entErr}]=await Promise.all([
  db.from('events').select('id,title,status,upload_starts_at,upload_ends_at').eq('id',id).maybeSingle(),
  db.from('event_storage_entitlements').select('status,expires_at,storage_limit_bytes').eq('event_id',id).maybeSingle()
 ])
 if(evErr||entErr)throw createError({statusCode:500,statusMessage:'Unable to inspect event'})
 if(!e)throw createError({statusCode:404,statusMessage:'Event not found'})
 const checks:Check[]=[]
 const add=(key:string,level:Check['level'],title:string,detail:string,action:string,target:Check['target']='none')=>
  checks.push({key,level,title,detail,action,target})
 const now=Date.now()
 if(e.status==='active')add('status','ok','Event active','Event status is Active.','No action required.')
 else add('status','blocked','Event not active',`Current status: ${e.status}.`,'Review the customer request and use Edit Event to set Active if appropriate.','edit')
 if(!e.upload_starts_at||!e.upload_ends_at)
  add('window','warning','Upload window incomplete','A start or end date is missing. Upload behaviour depends on your guest upload policy.','Review and set the upload window in Edit Event.','edit')
 else if(Date.parse(e.upload_starts_at)>now)
  add('window','warning','Uploads not yet started','Guest upload opening time is in the future.','Check the scheduled start date in Edit Event.','edit')
 else if(Date.parse(e.upload_ends_at)<now)
  add('window','blocked','Upload window ended','Guest upload closing time has passed.','Review the request and adjust the upload window if permitted.','edit')
 else add('window','ok','Upload window current','Current time falls within the configured upload window.','No action required.')
 if(!ent){
  add('entitlement','warning','No stored entitlement','No event storage entitlement row was found. This may indicate an unassigned starter entitlement or a provisioning problem.','Escalate to a Manager or SuperAdmin; do not grant storage manually.','retention')
 }else{
  if(ent.status!=='active')add('entitlement','blocked','Storage entitlement inactive',`Entitlement status: ${ent.status}.`,'Review the purchased package and retention history with a Manager or SuperAdmin.','retention')
  else add('entitlement','ok','Storage entitlement active','Storage entitlement status is Active.','No action required.')
  if(ent.expires_at&&Date.parse(ent.expires_at)<=now)
   add('expiry','blocked','Retention expired',`Expired: ${ent.expires_at}.`,'Manager/SuperAdmin: review paid retention or the authorised extension workflow.','retention')
  else if(ent.expires_at&&Date.parse(ent.expires_at)<=now+30*86400000)
   add('expiry','warning','Retention ending soon',`Expires: ${ent.expires_at}.`,'Advise the customer about the available retention extension options.','retention')
  else if(ent.expires_at)add('expiry','ok','Retention current',`Expires: ${ent.expires_at}.`,'No action required.')
  else add('expiry','info','No expiry recorded','Entitlement expiry is not set.','Verify the package entitlement with a Manager or SuperAdmin.','retention')
 }
 let usedBytes:number|null=null
 try{
  const usage=await storageUsage(id)
  usedBytes=Number(usage.usedBytes)
  const limit=ent?Number(ent.storage_limit_bytes):0
  if(limit>0&&Number.isFinite(usedBytes)){
   const percent=usedBytes/limit*100
   if(percent>=100)add('capacity','blocked','Storage allowance reached',`${percent.toFixed(1)}% used.`,'Ask the customer to upgrade their storage package.','retention')
   else if(percent>=85)add('capacity','warning','Storage nearly full',`${percent.toFixed(1)}% used.`,'Recommend a storage package upgrade.','retention')
   else add('capacity','ok','Storage capacity available',`${percent.toFixed(1)}% used.`,'No action required.')
  }else add('capacity','info','Storage allowance unavailable','No positive storage limit could be verified.','Check the entitlement.','retention')
 }catch{
  add('capacity','warning','Storage usage unavailable','The storage usage check failed; other results remain available.','Retry later or investigate the storage service.')
 }
 const blockers=checks.filter(c=>c.level==='blocked').length
 const warnings=checks.filter(c=>c.level==='warning').length
 return {eventId:id,checkedAt:new Date().toISOString(),role,summary:{blockers,warnings},
  checks,storage:{usedBytes,limitBytes:ent?Number(ent.storage_limit_bytes):null},
  note:'Diagnostic indicators are advisory. They do not guarantee guest upload availability; guest PIN, gallery visibility, media limits and other policies may also apply.'}
})
