import {getQuery,createError} from 'h3'
import {eventBySlug,requireGuest,adminDb} from '../../utils/media'
import {safeStyle,signedCover} from '../../utils/branding'
export default defineEventHandler(async event=>{
 const row=await eventBySlug(String(getQuery(event).slug||''))
 await requireGuest(event,row)
 // eventBySlug deliberately selects a restricted set of columns, so it does not
 // include newer branding and countdown settings. Read those settings separately
 // after enforcing guest PIN access.
 const {data:settings,error}=await adminDb().from('events').select('*').eq('id',row.id).single()
 if(error||!settings)throw createError({statusCode:500,statusMessage:'Could not load guest appearance'})
 return {...safeStyle(settings),upload_starts_at:settings.upload_starts_at||null,cover_url:await signedCover(settings.cover_path)}
})
