import {createClient} from '@supabase/supabase-js'
export const config={schedule:'0 3 * * *'}
export default async function(){
 const url=process.env.SUPABASE_URL,key=process.env.EVENTKEEPSAKES_SERVICE_ROLE_KEY
 if(!url||!key)throw new Error('Supabase credentials missing')
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})
 // Safety margin exceeds signed-upload URL validity. Only delete records with no object.
 const cutoff=new Date(Date.now()-48*3600_000).toISOString()
 const {data,error}=await db.from('event_media')
  .select('id,event_id,storage_path,mime_type,size_bytes')
  .eq('status','pending_upload').lt('created_at',cutoff).order('created_at').limit(100)
 if(error)throw error
 let released=0,preserved=0
 for(const m of data||[]){
  const {data:files,error:listErr}=await db.storage.from('event-media').list(m.event_id,{search:m.id,limit:10})
  if(listErr){preserved++;continue}
  const object=files?.find(x=>x.name===m.id)
  if(object){
   // Object exists: preserve it for owner review, never delete an uploaded file.
   preserved++;continue
  }
  const {error:delError}=await db.from('event_media').delete()
   .eq('id',m.id).eq('event_id',m.event_id).eq('status','pending_upload')
  if(delError)preserved++;else released++
 }
 console.log('[upload-reservation-cleanup]',{released,preserved})
 return new Response(JSON.stringify({released,preserved}),{headers:{'content-type':'application/json'}})
}
