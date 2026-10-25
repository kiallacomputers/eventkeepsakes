import {createError,getQuery} from 'h3'
import {requireStaff} from '../../../utils/payments'
import {adminDb} from '../../../utils/media'
export default defineEventHandler(async event=>{
 await requireStaff(event)
 const id=String(getQuery(event).id||'')
 if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id))throw createError({statusCode:400,statusMessage:'Invalid event ID'})
 const db=adminDb()
 const [{data:record,error},{data:entitlement},{data:notes,error:notesError},{data:audit,error:auditError}]=await Promise.all([
  db.from('events').select('id,owner_id,title,status,event_date,created_at,upload_starts_at,upload_ends_at,slug').eq('id',id).maybeSingle(),
  db.from('event_storage_entitlements').select('status,expires_at,storage_limit_bytes').eq('event_id',id).maybeSingle(),
  db.from('event_support_notes').select('id,note,staff_user_id,created_at').eq('event_id',id).order('created_at',{ascending:false}).limit(100),
  db.from('event_support_audit').select('id,action,reason,before_values,after_values,staff_user_id,created_at').eq('event_id',id).order('created_at',{ascending:false}).limit(100)
 ])
 if(error||notesError||auditError)throw createError({statusCode:500,statusMessage:'Unable to load support record'})
 if(!record)throw createError({statusCode:404,statusMessage:'Event not found'})
 const {data:owner,error:ownerError}=await db.auth.admin.getUserById(record.owner_id)
 if(ownerError)throw createError({statusCode:500,statusMessage:'Unable to load customer'})
 return {event:record,owner:{id:record.owner_id,email:owner.user?.email||''},entitlement,notes:notes||[],audit:audit||[]}
})
