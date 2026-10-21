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
export async function isSuperAdmin(userId: string): Promise<boolean> {
 const allow = (process.env.EVENTKEEPSAKES_ADMIN_USER_IDS || '').split(',').map(x=>x.trim()).filter(Boolean)
 if (allow.includes(userId)) return true
 const { data, error } = await adminDb().from('profiles').select('role').eq('id', userId).maybeSingle()
 if (error) throw createError({statusCode:500,statusMessage:'Unable to verify administrator role'})
 return data?.role === 'superadmin'
}
export async function requirePackageAdmin(event:any) {
 const userId = await ownerUser(event)
 if (!(await isSuperAdmin(userId))) throw createError({statusCode:403,statusMessage:'Administrator access required'})
 return userId
}
export async function activePlans() {
 const {data,error} = await adminDb().from('event_storage_plans').select('id,display_name,storage_limit_bytes,retention_days,price_cents,currency,active,sort_order').eq('active',true).order('sort_order')
 if(error) throw createError({statusCode:500,statusMessage:'Could not load packages'})
 return data || []
}
export function validCurrency(code:string) { return /^[A-Z]{3}$/.test(code) }
