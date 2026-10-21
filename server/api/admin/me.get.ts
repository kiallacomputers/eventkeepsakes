import { ownerUser } from '../../utils/media'
import { isSuperAdmin } from '../../utils/payments'
export default defineEventHandler(async event => {
 const userId = await ownerUser(event)
 return { allowed: await isSuperAdmin(userId) }
})
