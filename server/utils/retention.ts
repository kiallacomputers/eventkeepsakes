import {createError} from 'h3'
import {adminDb} from './media'
export async function getRetentionSettings() {
 const {data,error}=await adminDb().from('event_retention_settings').select('*').eq('id',1).single()
 if(error || !data) throw createError({statusCode:500,statusMessage:'Retention settings unavailable. Run migration 006.'})
 return data
}
export function retentionPhase(expiry:string|null, status:string, recoveryDays:number, now=Date.now()) {
 if(!expiry) return {phase:'no_expiry',recoveryEndsAt:null}
 const at=Date.parse(expiry)
 if(!Number.isFinite(at)) return {phase:'invalid_expiry',recoveryEndsAt:null}
 const recoveryEndsAt=new Date(at+recoveryDays*86400000).toISOString()
 if(now<at) return {phase:status==='active'?'active':'inactive',recoveryEndsAt}
 return {phase:now<at+recoveryDays*86400000?'recovery':'past_recovery',recoveryEndsAt}
}
