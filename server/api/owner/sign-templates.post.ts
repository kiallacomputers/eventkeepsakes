import {readBody,createError} from 'h3'
import {ownerUser,adminDb} from '../../utils/media'
import {requireTemplate,templateCategory,templateName,validTemplateConfig,templateView} from '../../utils/sign-templates'
export default defineEventHandler(async event=>{
 const userId=await ownerUser(event),b=await readBody(event),db=adminDb()
 if(b.action==='save'){
  let background_path:string|null=null
  if(b.sourceTemplateId){const source=await requireTemplate(String(b.sourceTemplateId));if(source.status!=='published'&&source.owner_id!==userId)throw createError({statusCode:403,statusMessage:'Cannot reuse private template artwork'});background_path=source.background_path||null}
  const row={background_path,owner_id:userId,name:templateName(b.name),category:templateCategory(b.category),config:validTemplateConfig(b.config),status:'personal',permission_to_publish:false}
  const {data,error}=await db.from('sign_template_library').insert(row).select('*').single()
  if(error)throw createError({statusCode:500,statusMessage:'Could not save personal layout'})
  return {template:await templateView(data)}
 }
 if(b.action==='submit'){
  const row=await requireTemplate(String(b.id||''))
  if(row.owner_id!==userId||!['personal','pending'].includes(row.status))throw createError({statusCode:403,statusMessage:'Not your personal layout'})
  if(b.permission!==true)throw createError({statusCode:400,statusMessage:'Permission to share the layout is required'})
  const {error}=await db.from('sign_template_library').update({status:'pending',permission_to_publish:true,updated_at:new Date().toISOString()}).eq('id',row.id).eq('owner_id',userId)
  if(error)throw createError({statusCode:500,statusMessage:'Could not submit layout'})
  return {ok:true}
 }
 if(b.action==='delete'){
  const row=await requireTemplate(String(b.id||''))
  if(row.owner_id!==userId||row.status!=='personal')throw createError({statusCode:403,statusMessage:'Only personal layouts can be deleted'})
  const {error}=await db.from('sign_template_library').delete().eq('id',row.id).eq('owner_id',userId)
  if(error)throw createError({statusCode:500,statusMessage:'Could not delete layout'})
  return {ok:true}
 }
 throw createError({statusCode:400,statusMessage:'Unknown template action'})
})
