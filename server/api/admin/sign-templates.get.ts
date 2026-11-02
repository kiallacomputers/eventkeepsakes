import {adminDb,ownerUser} from '../../utils/media'
import {staffRole} from '../../utils/payments'
import {templateView} from '../../utils/sign-templates'
export default defineEventHandler(async event=>{
 const userId=await ownerUser(event);const role=await staffRole(userId);if(!role)throw createError({statusCode:403,statusMessage:'Administration access required'})
 const {data,error}=await adminDb().from('sign_template_library').select('*').order('updated_at',{ascending:false}).limit(250)
 if(error)throw createError({statusCode:500,statusMessage:'Could not load templates. Apply migration 020.'})
 return {templates:await Promise.all((data||[]).map(async row=>({...await templateView(row),can_publish:row.owner_id===userId||row.permission_to_publish})))}
})
