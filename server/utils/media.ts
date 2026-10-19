import { createClient } from '@supabase/supabase-js'
import { createHmac, randomUUID, timingSafeEqual, createHash } from 'node:crypto'
import { createError, getCookie, getHeader, getRequestIP, setCookie } from 'h3'

export const BUCKET = 'event-media'
export const MAX_IMAGE = 20 * 1024 * 1024
export const MAX_VIDEO = 100 * 1024 * 1024
export const QUOTA = 500 * 1024 * 1024 // Phase 3 starter quota; Phase 4 will introduce packages
export const MIME: Record<string, 'image'|'video'> = {
 'image/jpeg':'image','image/png':'image','image/webp':'image','image/heic':'image','image/heif':'image',
 'video/mp4':'video','video/quicktime':'video','video/webm':'video'
}
export function adminDb() {
 const url = process.env.SUPABASE_URL
 const key = process.env.EVENTKEEPSAKES_SERVICE_ROLE_KEY
 if (!url || !key) throw createError({ statusCode:503, statusMessage:'Server media credentials not configured' })
 return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}})
}
function signingKey() {
 const secret = process.env.EVENTKEEPSAKES_SESSION_SECRET
 if (!secret || secret.length < 32) throw createError({statusCode:503,statusMessage:'Guest session signing key missing'})
 return secret
}
function signature(data:string) {return createHmac('sha256',signingKey()).update(data).digest('base64url')}
export function setGuestSession(event:any, id:string) {
 const payload=Buffer.from(JSON.stringify({id:event.id,slug:event.slug,exp:Date.now()+12*3600_000})).toString('base64url')
 setCookie(event,'ek_guest',`${payload}.${signature(payload)}`,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/api/guest',maxAge:12*3600})
}
export function guestSession(event:any, eventId:string) {
 const cookie=getCookie(event,'ek_guest') || ''
 const [payload,sig]=cookie.split('.')
 if (!payload || !sig) return false
 const expected=signature(payload)
 const given=Buffer.from(sig)
 if (given.length!==Buffer.byteLength(expected) || !timingSafeEqual(given,Buffer.from(expected))) return false
 try {const data=JSON.parse(Buffer.from(payload,'base64url').toString());return data.id===eventId && data.exp>Date.now()}catch{return false}
}
export async function requireGuest(event:any, row:any) {
 if (row.pin_enabled && !guestSession(event,row.id)) throw createError({statusCode:401,statusMessage:'Event PIN required'})
}
export async function ownerUser(event:any) {
 const auth=getHeader(event,'authorization')||''
 const token=auth.startsWith('Bearer ')?auth.slice(7):''
 if (!token) throw createError({statusCode:401,statusMessage:'Sign in required'})
 const {data,error}=await adminDb().auth.getUser(token)
 if (error || !data.user) throw createError({statusCode:401,statusMessage:'Invalid session'})
 return data.user.id
}
export async function eventBySlug(slug:string) {
 const {data,error}=await adminDb().from('events').select('id,owner_id,title,slug,status,pin_enabled,upload_starts_at,upload_ends_at,gallery_visibility,guest_downloads_enabled,guest_name_mode,show_contributor_names,moderation_enabled').eq('slug',slug).maybeSingle()
 if(error) throw createError({statusCode:500,statusMessage:'Could not load event'})
 if(!data) throw createError({statusCode:404,statusMessage:'Event not found'})
 return data
}
export async function ownerEvent(event:any,id:string) {
 const user=await ownerUser(event)
 const {data}=await adminDb().from('events').select('*').eq('id',id).eq('owner_id',user).maybeSingle()
 if(!data) throw createError({statusCode:404,statusMessage:'Event not found'})
 return data
}
export function assertOpen(row:any) {
 const now=Date.now()
 if(row.status!=='active' || (row.upload_starts_at && now<Date.parse(row.upload_starts_at)) || (row.upload_ends_at && now>Date.parse(row.upload_ends_at))) throw createError({statusCode:403,statusMessage:'Uploads are currently closed'})
}
export function ipHash(event:any) {
 const ip=getRequestIP(event,{xForwardedFor:true}) || 'unknown'
 return createHash('sha256').update(`${signingKey()}:${ip}`).digest('hex')
}
export function safeError(message:string,code=400):never {throw createError({statusCode:code,statusMessage:message})}
export { randomUUID }
