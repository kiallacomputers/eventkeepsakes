import {getQuery} from 'h3'
import {ownerEvent,adminDb} from '../../utils/media'
export default defineEventHandler(async event=>{
 const row=await ownerEvent(event,String(getQuery(event).id||''))
 const {error}=await adminDb().from('events').update({cover_path:null}).eq('id',row.id)
 if(error)throw createError({statusCode:500,statusMessage:'Could not remove cover'})
 // Old file is retained for poster snapshots and cleanup by a future retention job.
 return {ok:true}
})
