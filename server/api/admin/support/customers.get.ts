import {createError,getQuery} from 'h3'
import {requireStaff} from '../../../utils/payments'
import {adminDb} from '../../../utils/media'
export default defineEventHandler(async event=>{
 await requireStaff(event)
 const q=getQuery(event),page=Math.max(1,Math.min(1000,Number.parseInt(String(q.page||1),10)||1))
 const search=String(q.search||'').trim().toLowerCase().slice(0,120)
 const db=adminDb()
 // Supabase Admin API is paginated. Only a page of customers is returned.
 const {data,error}=await db.auth.admin.listUsers({page,perPage:100})
 if(error)throw createError({statusCode:500,statusMessage:'Unable to load customers'})
 const users=(data.users||[]).filter(u=>!search||u.email?.toLowerCase().includes(search)||u.id===search)
 const ids=users.map(u=>u.id)
 let counts=new Map<string,number>()
 if(ids.length){
  const {data:events,error:evError}=await db.from('events').select('owner_id').in('owner_id',ids).limit(10000)
  if(evError)throw createError({statusCode:500,statusMessage:'Unable to load customer events'})
  for(const row of events||[])counts.set(row.owner_id,(counts.get(row.owner_id)||0)+1)
 }
 return {items:users.map(u=>({id:u.id,email:u.email||'',created_at:u.created_at,last_sign_in_at:u.last_sign_in_at,eventCount:counts.get(u.id)||0})),page,hasMore:(data.users||[]).length===100,searchScope:'current_page'}
})
