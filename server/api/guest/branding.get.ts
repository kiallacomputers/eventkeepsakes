import {getQuery} from 'h3'
import {eventBySlug,requireGuest} from '../../utils/media'
import {safeStyle,signedCover} from '../../utils/branding'
export default defineEventHandler(async event=>{
 const row=await eventBySlug(String(getQuery(event).slug||''))
 await requireGuest(event,row)
 return {...safeStyle(row),cover_url:await signedCover((row as any).cover_path)}
})
