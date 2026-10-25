import Stripe from 'stripe'
import { createError, getHeader } from 'h3'
import { adminDb, ownerUser } from './media'
export function stripeClient() {
 const key = process.env.STRIPE_SECRET_KEY
 if (!key) throw createError({statusCode:503,statusMessage:'Stripe is not configured'})
 return new Stripe(key)
}
export function paymentOrigin(event:any) {
 const configured = process.env.EVENTKEEPSAKES_SITE_URL
 if (!configured) throw createError({statusCode:503,statusMessage:'EVENTKEEPSAKES_SITE_URL is not configured'})
 const url = new URL(configured)
 if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.hostname==='localhost')) throw createError({statusCode:503,statusMessage:'Invalid site URL'})
 return url.origin
}
export async function staffRole(userId:string):Promise<'admin'|'manager'|'superadmin'|null>{
 // Netlify's original SuperAdmin allowlist takes precedence over database roles.
 // This check is server-side only. Never expose this variable via public runtime config.
 const allowedIds = (process.env.EVENTKEEPSAKES_ADMIN_USER_IDS || '')
   .split(',').map(value=>value.trim()).filter(Boolean)
 if (allowedIds.includes(userId)) return 'superadmin'

 const db=adminDb()
 const {data:staff,error:staffError}=await db.from('staff_members')
   .select('role,active').eq('user_id',userId).maybeSingle()
 if(staffError)throw createError({statusCode:500,statusMessage:'Staff roles unavailable. Check migration 011.'})
 if(staff){
   if(!staff.active)return null
   if(staff.role==='superadmin'||staff.role==='manager'||staff.role==='admin')return staff.role
   return null
 }
 const {data:profile,error}=await db.from('profiles').select('role').eq('id',userId).maybeSingle()
 if(error)throw createError({statusCode:500,statusMessage:'Unable to verify administrator role'})
 return profile?.role==='superadmin'?'superadmin':null
}
export async function isSuperAdmin(userId:string):Promise<boolean>{return (await staffRole(userId))==='superadmin'}
export async function requireManager(event:any){
 const userId=await ownerUser(event)
 const role=await staffRole(userId)
 if(role!=='manager'&&role!=='superadmin')throw createError({statusCode:403,statusMessage:'Manager or SuperAdmin access required'})
 return userId
}
export async function requireStaff(event:any){
 const userId=await ownerUser(event),role=await staffRole(userId)
 if(!role)throw createError({statusCode:403,statusMessage:'Staff access required'})
 return {userId,role}
}
export async function requirePackageAdmin(event:any){
 const userId=await ownerUser(event)
 if(!(await isSuperAdmin(userId)))throw createError({statusCode:403,statusMessage:'SuperAdmin access required'})
 return userId
}
export async function activePlans() {
 const {data,error} = await adminDb().from('event_storage_plans').select('id,display_name,storage_limit_bytes,retention_days,price_cents,currency,active,sort_order').eq('active',true).order('sort_order')
 if(error) throw createError({statusCode:500,statusMessage:'Could not load packages'})
 return data || []
}
export function validCurrency(code:string) { return /^[A-Z]{3}$/.test(code) }
