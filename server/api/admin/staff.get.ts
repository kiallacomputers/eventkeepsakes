import {requirePackageAdmin} from '../../utils/payments'
import {adminDb} from '../../utils/media'
import {createError} from 'h3'
export default defineEventHandler(async event=>{
 await requirePackageAdmin(event)
 const db=adminDb()
 const {data,error}=await db.from('staff_members').select('user_id,role,active,updated_at').order('updated_at',{ascending:false}).limit(500)
 if(error)throw createError({statusCode:500,statusMessage:'Unable to load staff'})
 const staff=await Promise.all((data||[]).map(async item=>{
  const {data:user}=await db.auth.admin.getUserById(item.user_id)
  return {...item,email:user.user?.email||'Unknown account'}
 }))
 return {staff,bootstrapUserIds:(process.env.EVENTKEEPSAKES_ADMIN_USER_IDS||'').split(',').map(x=>x.trim()).filter(Boolean)}
})
