import {getQuery} from 'h3'
import {ownerEvent} from '../../utils/media'
import {signedCover,safeStyle} from '../../utils/branding'
export default defineEventHandler(async event=>{
 const row=await ownerEvent(event,String(getQuery(event).id||''))
 return {...safeStyle(row),cover_url:await signedCover(row.cover_path)}
})
