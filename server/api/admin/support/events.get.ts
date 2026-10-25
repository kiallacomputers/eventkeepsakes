import {createError,getQuery} from 'h3'
import {requireStaff} from '../../../utils/payments'
import {adminDb} from '../../../utils/media'
export default defineEventHandler(async event=>{
 await requireStaff(event)
 const q=getQuery(event),search=String(q.search||'').trim().slice(0,100)
 const page=Math.max(1,Math.min(1000,Number.parseInt(String(q.page||1),10)||1))
 const db=adminDb()
 let query=db.from('events').select('id,owner_id,title,status,event_date,created_at,upload_starts_at,upload_ends_at',{count:'exact'})
 .order('created_at',{ascending:false}).range((page-1)*25,page*25-1)
 if(search){
  if(/^[0-9a-f-]{36}$/i.test(search))query=query.or(`id.eq.${search},owner_id.eq.${search}`)
  else query=query.ilike('title',`%${search.replace(/[%_,()]/g,'')}%`)
 }
 const {data,error,count}=await query
 if(error)throw createError({statusCode:500,statusMessage:'Unable to search events'})
 const ids=(data||[]).map(x=>x.id)
 let entitlements:any[]=[]
 if(ids.length){
  const result=await db.from('event_storage_entitlements').select('event_id,status,expires_at,storage_limit_bytes').in('event_id',ids)
  if(result.error)throw createError({statusCode:500,statusMessage:'Unable to load event retention'})
  entitlements=result.data||[]
 }
 const byId=new Map(entitlements.map(x=>[x.event_id,x]))
 return {items:(data||[]).map(x=>({...x,retention:byId.get(x.id)||null})),total:count||0,page,pageSize:25}
})
