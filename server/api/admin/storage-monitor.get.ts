import {createError} from 'h3'
import {requireManager} from '../../utils/payments'
import {adminDb} from '../../utils/media'
export default defineEventHandler(async event=>{
 await requireManager(event)
 const db=adminDb()
 // Bounded monitoring window: no unbounded table scan or raw media exposure.
 const {data:ent,error}=await db.from('event_storage_entitlements')
  .select('event_id,storage_limit_bytes,status,expires_at').order('event_id').limit(500)
 if(error)throw createError({statusCode:500,statusMessage:'Unable to load entitlements'})
 const ids=(ent||[]).map(e=>e.event_id)
 if(!ids.length)return {events:[],summary:{total:0,nearLimit:0,atLimit:0,unknown:0},truncated:false,checkedAt:new Date().toISOString()}
 const {data:events,error:eventError}=await db.from('events').select('id,title').in('id',ids)
 if(eventError)throw createError({statusCode:500,statusMessage:'Unable to load event names'})
 const usage=new Map<string,number>()
 let incomplete=false
 // Paginate explicitly; Supabase commonly limits a response to 1,000 rows.
 for(let offset=0;offset<10000;offset+=500){
  const {data:page,error:mediaError}=await db.from('event_media')
   .select('id,event_id,size_bytes').in('event_id',ids)
   .order('id').range(offset,offset+499)
  if(mediaError)throw createError({statusCode:500,statusMessage:'Unable to load media usage'})
  for(const m of page||[])usage.set(m.event_id,(usage.get(m.event_id)||0)+Number(m.size_bytes||0))
  if((page||[]).length<500)break
  if(offset===9500)incomplete=true
 }
 const titles=new Map((events||[]).map(e=>[e.id,e.title]))
 const rows=(ent||[]).map(e=>{
  const limit=Number(e.storage_limit_bytes),used=usage.get(e.event_id)||0
  const percent=limit>0&&!incomplete?Math.round(used/limit*1000)/10:null
  const level=percent===null?'unknown':percent>=100?'full':percent>=85?'warning':'ok'
  return {eventId:e.event_id,title:titles.get(e.event_id)||'Untitled event',limitBytes:limit,
   usedBytes:incomplete?null:used,percent,level,status:e.status,expiresAt:e.expires_at}
 }).sort((a,b)=>({full:0,warning:1,unknown:2,ok:3}[a.level]-{full:0,warning:1,unknown:2,ok:3}[b.level]))
 return {events:rows,summary:{total:rows.length,nearLimit:rows.filter(x=>x.level==='warning').length,
  atLimit:rows.filter(x=>x.level==='full').length,unknown:rows.filter(x=>x.level==='unknown').length},
  truncated:(ent||[]).length>=500||incomplete,checkedAt:new Date().toISOString()}
})
