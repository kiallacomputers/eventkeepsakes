import {createError,readBody} from 'h3'
import {requireStaff} from '../../../utils/payments'
import {adminDb} from '../../../utils/media'
const uuid=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i
function iso(v:unknown){
 if(v===null||v===undefined||v==='')return null
 if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(v)||!Number.isFinite(Date.parse(v)))
  throw createError({statusCode:400,statusMessage:'Invalid upload date'})
 return new Date(v).toISOString()
}
export default defineEventHandler(async event=>{
 const {userId}=await requireStaff(event)
 const b=await readBody(event)
 const id=String(b?.eventId||''),title=String(b?.title||'').trim(),reason=String(b?.reason||'').trim()
 const status=String(b?.status||'')
 const eventDate=b?.eventDate===null||b?.eventDate===''?null:String(b?.eventDate||'')
 if(!uuid.test(id)||title.length<2||title.length>200||reason.length<10||reason.length>1000||!['draft','active','paused','closed'].includes(status))
  throw createError({statusCode:400,statusMessage:'Invalid event, title, status or reason (minimum 10 characters)'})
 if(eventDate!==null&&!/^\d{4}-\d{2}-\d{2}$/.test(eventDate))throw createError({statusCode:400,statusMessage:'Invalid event date'})
 const starts=iso(b?.uploadStartsAt),ends=iso(b?.uploadEndsAt)
 if(starts&&ends&&Date.parse(starts)>=Date.parse(ends))throw createError({statusCode:400,statusMessage:'Upload end must be after start'})
 const db=adminDb()
 const {error}=await db.rpc('staff_update_event_support',{
  p_event_id:id,p_actor:userId,p_title:title,p_event_date:eventDate,p_status:status,
  p_upload_starts_at:starts,p_upload_ends_at:ends,p_reason:reason
 })
 if(error)throw createError({statusCode:400,statusMessage:'Event update failed: '+error.message})
 return {ok:true}
})
