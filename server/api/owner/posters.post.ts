import {readBody,createError} from 'h3'
import {adminDb,ownerEvent} from '../../utils/media'
import {COVER_BUCKET,signedCover} from '../../utils/branding'
import {randomUUID} from 'node:crypto'
export default defineEventHandler(async event=>{
 const b=await readBody(event),row=await ownerEvent(event,String(b.eventId||''))
 const name=String(b.name||'Welcome poster').trim().slice(0,80)
 const config=b.config||{}
 if(!['A4','A5'].includes(config.paper)||!['classic','romance','modern'].includes(config.theme)||typeof config.heading!=='string'||config.heading.length>100||typeof config.message!=='string'||config.message.length>260||typeof config.showDate!=='boolean'||typeof config.useCover!=='boolean')throw createError({statusCode:400,statusMessage:'Invalid poster design'})
 const db=adminDb()
 let snapshotPath:string|null=null
 if(config.useCover&&row.cover_path){
  const original=row.cover_path as string,ext=original.split('.').pop()||'jpg'
  snapshotPath=`${row.id}/posters/${randomUUID()}.${ext}`
  const {data:download,error:readError}=await db.storage.from(COVER_BUCKET).download(original)
  if(readError||!download)throw createError({statusCode:500,statusMessage:'Could not snapshot poster cover'})
  const {error:uploadError}=await db.storage.from(COVER_BUCKET).upload(snapshotPath,await download.arrayBuffer(),{contentType:download.type||'image/jpeg',upsert:false})
  if(uploadError)throw createError({statusCode:500,statusMessage:'Could not save poster cover snapshot'})
 }
 const {data,error}=await db.from('event_poster_designs').insert({event_id:row.id,name,config,snapshot_path:snapshotPath}).select('id').single()
 if(error)throw createError({statusCode:500,statusMessage:'Could not save poster'})
 return {id:data.id,snapshot_url:await signedCover(snapshotPath)}
})
