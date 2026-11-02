import {readBody,createError} from 'h3'
import {adminDb,ownerUser} from '../../utils/media'
import {staffRole} from '../../utils/payments'
import {requireTemplate,templateName,templateCategory,templateView} from '../../utils/sign-templates'
export default defineEventHandler(async event=>{
 const userId=await ownerUser(event),role=await staffRole(userId)
 if(!role)throw createError({statusCode:403,statusMessage:'Administration access required'})
 const b=await readBody(event),row=await requireTemplate(String(b.id||''))
 const status=String(b.status||'')
 if(!['personal','pending','published','archived'].includes(status))throw createError({statusCode:400,statusMessage:'Invalid status'})
 if(status==='published'&&row.owner_id!==userId&&!row.permission_to_publish)throw createError({statusCode:403,statusMessage:'Owner has not permitted publication'})
 if(status==='published'&&row.status==='personal'&&row.owner_id!==userId)throw createError({statusCode:403,statusMessage:'Owner must submit their design'})
 const changes:any={status,name:templateName(b.name??row.name),category:templateCategory(b.category??row.category),updated_at:new Date().toISOString()}
 // Publishing a template never modifies the owner's event poster.
 const {data,error}=await adminDb().from('sign_template_library').update(changes).eq('id',row.id).select('*').single()
 if(error)throw createError({statusCode:500,statusMessage:'Could not update template'})
 return {template:await templateView(data)}
})
