import {createError,getQuery} from 'h3'
import {adminDb,ownerUser} from '../../utils/media'
import {staffRole} from '../../utils/payments'
import {requireTemplate} from '../../utils/sign-templates'

export default defineEventHandler(async event=>{
 const userId=await ownerUser(event)
 const role=await staffRole(userId)
 // Enforced server-side: Managers may archive, but cannot delete.
 if(role!=='admin'&&role!=='superadmin')
  throw createError({statusCode:403,statusMessage:'Only administrators can permanently delete templates'})
 const id=String(getQuery(event).id||'')
 if(!/^[a-f0-9-]{36}$/i.test(id))
  throw createError({statusCode:400,statusMessage:'Invalid template ID'})
 const db=adminDb()
 const template=await requireTemplate(id)
 if(template.status==='published')
  throw createError({statusCode:409,statusMessage:'Archive this template before deleting it'})

 // A saved poster can reference the original master template. Fail closed if
 // the lookup fails; never delete a template when usage is uncertain.
 const {data:posters,error:posterError}=await db.from('event_poster_designs')
  .select('id').contains('config',{backgroundTemplateId:id}).limit(1)
 if(posterError)throw createError({statusCode:500,statusMessage:'Could not verify saved poster usage; deletion cancelled'})
 if(posters?.length)throw createError({statusCode:409,statusMessage:'This template is used by saved event signs. Archive it instead.'})

 // Personal layouts may reuse the master artwork without storing a source ID.
 // Protect artwork-linked templates even if their source record is a copy.
 if(template.background_path){
  const {data:linked,error:linkedError}=await db.from('sign_template_library')
   .select('id').eq('background_path',template.background_path).neq('id',id).limit(1)
  if(linkedError)throw createError({statusCode:500,statusMessage:'Could not verify linked layouts; deletion cancelled'})
  if(linked?.length)throw createError({statusCode:409,statusMessage:'Another saved layout uses this artwork. Archive the template instead.'})
 }
 // Variation artwork is deliberately retained in storage: deleting shared
 // files can break posters and independently saved owner layouts.
 const {error}=await db.from('sign_template_library').delete().eq('id',id).neq('status','published')
 if(error)throw createError({statusCode:500,statusMessage:'Could not delete template'})
 return {ok:true}
})
