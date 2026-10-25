import {ownerUser} from '../../utils/media'
import {staffRole} from '../../utils/payments'
export default defineEventHandler(async event=>{
 const role=await staffRole(await ownerUser(event))
 return {allowed:!!role,role,isSuperAdmin:role==='superadmin'}
})
