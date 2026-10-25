import {createError,getQuery} from 'h3'
import {adminDb,ownerEvent} from '../../utils/media'

export default defineEventHandler(async request=>{
 const id=String(getQuery(request).id||'')
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
  throw createError({statusCode:400,statusMessage:'Invalid event ID'})
 const owner=await ownerEvent(request,id)
 const db=adminDb()
 const counts=await Promise.all([
  db.from('event_media').select('id',{count:'exact',head:true}).eq('event_id',id).neq('status','pending_upload'),
  db.from('event_media').select('id',{count:'exact',head:true}).eq('event_id',id).eq('status','pending'),
  db.from('event_media').select('id',{count:'exact',head:true}).eq('event_id',id).eq('status','approved'),
  db.from('event_media').select('id',{count:'exact',head:true}).eq('event_id',id).eq('media_type','image').neq('status','pending_upload'),
  db.from('event_media').select('id',{count:'exact',head:true}).eq('event_id',id).eq('media_type','video').neq('status','pending_upload')
 ])
 if(counts.some(c=>c.error))throw createError({statusCode:500,statusMessage:'Unable to load event statistics'})
 const [total,pending,approved,photos,videos]=counts.map(c=>c.count??0)
 const now=Date.now(),start=owner.upload_starts_at?Date.parse(owner.upload_starts_at):null
 const end=owner.upload_ends_at?Date.parse(owner.upload_ends_at):null
 const uploadState=owner.status!=='active'?'closed':start!==null&&now<start?'scheduled':end!==null&&now>end?'closed':'open'
 return {total,pending,approved,photos,videos,uploadState,
  uploadStartsAt:owner.upload_starts_at,uploadEndsAt:owner.upload_ends_at,
  eventStatus:owner.status,generatedAt:new Date().toISOString()}
})
