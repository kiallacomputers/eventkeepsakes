import {ownerUser,adminDb} from '../../utils/media'
import {templateView} from '../../utils/sign-templates'
export default defineEventHandler(async event=>{
 const userId=await ownerUser(event)
 const {data,error}=await adminDb().from('sign_template_library').select('*').or(`owner_id.eq.${userId},status.eq.published`).order('updated_at',{ascending:false}).limit(150)
 if(error)throw createError({statusCode:500,statusMessage:'Could not load template library. Apply migration 020.'})
 return {templates:await Promise.all((data||[]).map(templateView))}
})
