import {readBody,createError} from 'h3'
import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
export default defineEventHandler(async event=>{
 const actor=await requirePackageAdmin(event)
 const b=await readBody(event)
 const userId=String(b?.userId||'').trim(),role=b?.role,active=b?.active===true
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)||!['admin','manager','superadmin'].includes(role))
  throw createError({statusCode:400,statusMessage:'Valid existing user ID and role required'})
 const db=adminDb()
 const {data:user,error:ue}=await db.auth.admin.getUserById(userId)
 if(ue||!user.user)throw createError({statusCode:404,statusMessage:'User must register before becoming staff'})
 const bootstrap=(process.env.EVENTKEEPSAKES_ADMIN_USER_IDS||'').split(',').map(x=>x.trim()).filter(Boolean)
 if(bootstrap.includes(userId)&&(!active||role!=='superadmin'))throw createError({statusCode:400,statusMessage:'Bootstrap SuperAdmin cannot be downgraded here'})
 if(userId===actor&&(!active||role!=='superadmin'))throw createError({statusCode:400,statusMessage:'You cannot remove your own SuperAdmin access'})
 const {error}=await db.from('staff_members').upsert({user_id:userId,role,active,updated_at:new Date().toISOString(),updated_by:actor},{onConflict:'user_id'})
 if(error)throw createError({statusCode:500,statusMessage:'Could not save staff member'})
 return {saved:true,email:user.user.email}
})
