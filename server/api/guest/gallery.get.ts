import {getQuery,createError} from 'h3'
import {adminDb,eventBySlug,requireGuest,BUCKET} from '../../utils/media'
export default defineEventHandler(async(event)=>{
 const slug=String(getQuery(event).slug||'')
 const row=await eventBySlug(slug)
 await requireGuest(event,row)
 if(row.gallery_visibility!=='shared') throw createError({statusCode:403,statusMessage:'This gallery is private'})
 const db=adminDb()
 const {data,error}=await db.from('event_media').select('id,storage_path,mime_type,media_type,contributor_name,created_at,original_name').eq('event_id',row.id).eq('status','approved').order('created_at',{ascending:false}).limit(100)
 if(error) throw createError({statusCode:500,statusMessage:'Unable to load gallery'})
 const media=[]
 for(const m of data||[]){
  const {data:signed}=await db.storage.from(BUCKET).createSignedUrl(m.storage_path,600,{download:false})
  if(signed) media.push({id:m.id,url:signed.signedUrl,media_type:m.media_type,name:row.show_contributor_names?m.contributor_name:null,download:row.guest_downloads_enabled,filename:row.guest_downloads_enabled?m.original_name:null})
 }
 return {media,guestDownloads:row.guest_downloads_enabled}
})
