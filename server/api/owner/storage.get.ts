import {getQuery} from 'h3'
import {adminDb,ownerEvent} from '../../utils/media'
import {storageEntitlement} from '../../utils/storage-plans'
export default defineEventHandler(async event=>{
 const eventId=String(getQuery(event).eventId||'')
 await ownerEvent(event,eventId)
 const db=adminDb(),ent=await storageEntitlement(eventId)
 const {data,error}=await db.from('event_media').select('id,size_bytes,status').eq('event_id',eventId)
 if(error)throw createError({statusCode:500,statusMessage:'Could not load storage usage'})
 const rows=data||[]
 const reservedBytes=rows.filter(x=>x.status==='pending_upload').reduce((s,x)=>s+Number(x.size_bytes||0),0)
 const usedBytes=rows.filter(x=>x.status!=='pending_upload').reduce((s,x)=>s+Number(x.size_bytes||0),0)
 return {eventId,limitBytes:ent.limitBytes,usedBytes,reservedBytes,
  availableBytes:Math.max(0,ent.limitBytes-usedBytes-reservedBytes),
  files:rows.filter(x=>x.status!=='pending_upload').length,
  pending:rows.filter(x=>x.status==='pending').length,
  approved:rows.filter(x=>x.status==='approved').length,
  status:ent.status,expiresAt:ent.expiresAt}
})
