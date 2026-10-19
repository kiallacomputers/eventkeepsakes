import { createError } from 'h3'
import { adminDb } from './media'

// Storage packages live in the database, not in Vue components or upload handlers.
// Later Stripe webhooks can assign plans by updating event_storage_entitlements.
export const DEFAULT_LIMIT_BYTES = 500 * 1024 * 1024
export const MAX_EXPORT_FILES = 250
export const MAX_EXPORT_BYTES = 500 * 1024 * 1024 // Conservative serverless safeguard; raise after load testing.

export async function storageEntitlement(eventId: string) {
 const db = adminDb()
 const { data, error } = await db.from('event_storage_entitlements')
  .select('storage_limit_bytes, expires_at, status')
  .eq('event_id', eventId).maybeSingle()
 if (error) throw createError({statusCode:500,statusMessage:'Could not load event storage entitlement. Run Phase 5A migration.'})
 return {
  limitBytes: Number(data?.storage_limit_bytes ?? DEFAULT_LIMIT_BYTES),
  status: String(data?.status ?? 'active'),
  expiresAt: data?.expires_at ?? null
 }
}
export async function storageUsage(eventId: string) {
 const db = adminDb()
 // Count uploaded and reserved files, including rejected ones still stored.
 const {data,error} = await db.from('event_media').select('size_bytes,status').eq('event_id',eventId)
 if(error) throw createError({statusCode:500,statusMessage:'Could not calculate event storage usage'})
 const items = data || []
 return {
  usedBytes: items.reduce((sum:number,m:any)=>sum+Number(m.size_bytes||0),0),
  files: items.filter((m:any)=>m.status!=='pending_upload').length,
  pending: items.filter((m:any)=>m.status==='pending').length,
  approved: items.filter((m:any)=>m.status==='approved').length
 }
}
