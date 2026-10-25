import {readBody} from 'h3'
import {adminDb,ownerEvent} from '../../utils/media'
export default defineEventHandler(async event=>{
 const body=await readBody(event),id=String(body?.id||'')
 await ownerEvent(event,id)
 const welcome_message=String(body?.welcome_message||'').trim()
 const layout=String(body?.layout||'grid'),theme=String(body?.theme||'classic'),accent_color=String(body?.accent_color||'#B18A50')
 const cover_media_id=body?.cover_media_id||null
 if(welcome_message.length>500||!['grid','masonry'].includes(layout)||!['classic','wedding','birthday','corporate','custom'].includes(theme)||!/^#[0-9a-fA-F]{6}$/.test(accent_color))throw createError({statusCode:400,statusMessage:'Invalid gallery appearance settings'})
 const db=adminDb()
 if(cover_media_id){
  if(typeof cover_media_id!=='string'||!/^[0-9a-f-]{36}$/i.test(cover_media_id))throw createError({statusCode:400,statusMessage:'Invalid cover photo'})
  const {data}=await db.from('event_media').select('id').eq('id',cover_media_id).eq('event_id',id).eq('status','approved').eq('media_type','image').maybeSingle()
  if(!data)throw createError({statusCode:400,statusMessage:'Cover photo must be an approved image in this event'})
 }
 const {error}=await db.from('event_gallery_styles').upsert({event_id:id,welcome_message,layout,theme,accent_color,cover_media_id},{onConflict:'event_id'})
 if(error)throw createError({statusCode:500,statusMessage:'Unable to save gallery style. Check Phase 9E migration.'})
 return {ok:true}
})
