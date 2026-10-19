import {getQuery,createError} from 'h3'
import {adminDb,ownerEvent,BUCKET} from '../../utils/media'
export default defineEventHandler(async(event)=>{
 const id=String(getQuery(event).id||'')
 await ownerEvent(event,id)
 const db=adminDb()
 const {data,error}=await db.from('event_media').select('*').eq('event_id',id).neq('status','pending_upload').order('created_at',{ascending:false}).limit(200)
 if(error) throw createError({statusCode:500,statusMessage:'Could not list uploads'})
 const media=[]
 for(const m of data||[]){const {data:signed}=await db.storage.from(BUCKET).createSignedUrl(m.storage_path,600);media.push({...m,url:signed?.signedUrl||null})}
 return {media}
})
