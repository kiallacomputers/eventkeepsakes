import {getQuery} from 'h3'
import {adminDb,eventBySlug,requireGuest} from '../../utils/media'
export default defineEventHandler(async event=>{
 const slug=String(getQuery(event).slug||'')
 const row=await eventBySlug(slug)
 await requireGuest(event,row)
 const {data,error}=await adminDb().from('event_gallery_styles').select('welcome_message,cover_media_id,layout,theme,accent_color').eq('event_id',row.id).maybeSingle()
 if(error)throw createError({statusCode:500,statusMessage:'Unable to load gallery appearance'})
 // Do not expose cover ID when the event gallery is private.
 const style=data||{welcome_message:'',cover_media_id:null,layout:'grid',theme:'classic',accent_color:'#B18A50'}
 return {...style,cover_media_id:row.gallery_visibility==='shared'?style.cover_media_id:null}
})
