import {getQuery} from 'h3'
import {adminDb,ownerEvent} from '../../utils/media'
export default defineEventHandler(async event=>{
 const id=String(getQuery(event).id||'');await ownerEvent(event,id)
 const {data,error}=await adminDb().from('event_gallery_styles').select('welcome_message,cover_media_id,layout,theme,accent_color').eq('event_id',id).maybeSingle()
 if(error)throw createError({statusCode:500,statusMessage:'Unable to load gallery style. Apply Phase 9E SQL migration.'})
 return data||{welcome_message:'',cover_media_id:null,layout:'grid',theme:'classic',accent_color:'#B18A50'}
})
