import {createError,getQuery} from 'h3'
import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
export default defineEventHandler(async event=>{
 await requirePackageAdmin(event)
 const page=Number(getQuery(event).page||1)
 if(!Number.isSafeInteger(page)||page<1||page>10000)
  throw createError({statusCode:400,statusMessage:'Invalid page'})
 const db=adminDb()
 const {data:users,error}=await db.auth.admin.listUsers({page,perPage:100})
 if(error)throw createError({statusCode:500,statusMessage:'Unable to load registered users'})
 const {data:staff,error:staffError}=await db.from('staff_members').select('user_id,role,active').limit(10000)
 if(staffError)throw createError({statusCode:500,statusMessage:'Unable to load staff assignments'})
 const assigned=new Map((staff||[]).map(s=>[s.user_id,s]))
 const bootstrap=new Set((process.env.EVENTKEEPSAKES_ADMIN_USER_IDS||'').split(',').map(s=>s.trim()).filter(Boolean))
 const list=(users.users||[]).map(u=>{
  const s=assigned.get(u.id)
  return {id:u.id,email:u.email||'(no email)',createdAt:u.created_at,
   assigned:!!s||bootstrap.has(u.id),role:bootstrap.has(u.id)?'superadmin':s?.role||null,
   active:bootstrap.has(u.id)?true:s?.active??null}
 })
 return {users:list,page,hasMore:list.length===100}
})
