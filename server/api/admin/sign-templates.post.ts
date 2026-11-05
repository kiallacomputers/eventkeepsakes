import {readBody,createError} from 'h3'
import {adminDb,ownerUser} from '../../utils/media'
import {staffRole} from '../../utils/payments'
import {requireTemplate,templateName,templateCategory,templateView,validTemplateConfig} from '../../utils/sign-templates'
export default defineEventHandler(async event=>{
 const userId=await ownerUser(event),role=await staffRole(userId)
 if(!role)throw createError({statusCode:403,statusMessage:'Administration access required'})
 const b=await readBody(event)
 if(b.action==='create'||b.action==='duplicate'){
  const source=b.action==='duplicate'?await requireTemplate(String(b.id||'')):null
  if(source&&source.status==='personal'&&source.owner_id!==userId)throw createError({statusCode:403,statusMessage:'Cannot duplicate a private layout'})
  if(source&&source.status==='pending'&&source.owner_id!==userId&&!source.permission_to_publish)throw createError({statusCode:403,statusMessage:'Owner has not granted reuse permission'})
  const config=validTemplateConfig(b.config??source?.config??{})
  const rowData={owner_id:userId,name:templateName(b.name??(source?.name+' Copy')),category:templateCategory(b.category??source?.category??'wedding'),status:'personal',permission_to_publish:true,config,background_path:source?.background_path??null}
  const {data,error}=await adminDb().from('sign_template_library').insert(rowData).select('*').single()
  if(error)throw createError({statusCode:500,statusMessage:'Could not create template'})
  return {template:await templateView(data)}
 }
 const row=await requireTemplate(String(b.id||''))
 const status=String(b.status||'')
 if(!['personal','pending','published','archived'].includes(status))throw createError({statusCode:400,statusMessage:'Invalid status'})
 if(status==='published'&&row.owner_id!==userId&&!row.permission_to_publish)throw createError({statusCode:403,statusMessage:'Owner has not permitted publication'})
 if(status==='published'&&row.status==='personal'&&row.owner_id!==userId)throw createError({statusCode:403,statusMessage:'Owner must submit their design'})
 const changes:any={status,name:templateName(b.name??row.name),category:templateCategory(b.category??row.category),updated_at:new Date().toISOString()}
 if(b.config!==undefined){
  const cfg=validTemplateConfig(b.config)
  const stored=new Set((row.config?.variants||[]).map((v:any)=>v.background_path).filter(Boolean))
  for(const v of cfg.variants||[])if(v.background_path&&!stored.has(v.background_path))throw createError({statusCode:400,statusMessage:'Upload variation artwork before saving'})
  changes.config=cfg
 }
 // Publishing a template never modifies the owner's event poster.
 const {data,error}=await adminDb().from('sign_template_library').update(changes).eq('id',row.id).select('*').single()
 if(error)throw createError({statusCode:500,statusMessage:'Could not update template'})
 return {template:await templateView(data)}
})
