import {readBody} from 'h3'
import {ownerEvent,adminDb} from '../../utils/media'
import {validateStyle} from '../../utils/branding'
export default defineEventHandler(async event=>{
 const b=await readBody(event),row=await ownerEvent(event,String(b.id||''))
 const {error}=await adminDb().from('events').update(validateStyle(b)).eq('id',row.id)
 if(error)throw createError({statusCode:500,statusMessage:'Could not save gallery branding'})
 return {ok:true}
})
