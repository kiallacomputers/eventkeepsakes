import {getQuery} from 'h3'
import {adminDb,ownerEvent} from '../../utils/media'
import {signedCover} from '../../utils/branding'
export default defineEventHandler(async event=>{
 const id=String(getQuery(event).id||'');await ownerEvent(event,id)
 const {data,error}=await adminDb().from('event_poster_designs').select('id,name,config,snapshot_path,updated_at').eq('event_id',id).order('updated_at',{ascending:false}).limit(30)
 if(error)throw createError({statusCode:500,statusMessage:'Could not load poster designs'})
 return {designs:await Promise.all((data||[]).map(async d=>({...d,snapshot_url:await signedCover(d.snapshot_path)})))}
})
