import {getQuery,createError} from 'h3'
import {ownerEvent} from '../../utils/media'
import {storageEntitlement,storageUsage,MAX_EXPORT_BYTES,MAX_EXPORT_FILES} from '../../utils/storage-plans'
export default defineEventHandler(async event => {
 const id=String(getQuery(event).id||'')
 if(!/^[0-9a-f-]{36}$/i.test(id)) throw createError({statusCode:400,statusMessage:'Invalid event ID'})
 await ownerEvent(event,id)
 const [entitlement,usage]=await Promise.all([storageEntitlement(id),storageUsage(id)])
 return {...entitlement,...usage,remainingBytes:Math.max(0,entitlement.limitBytes-usage.usedBytes),exportLimits:{maxFiles:MAX_EXPORT_FILES,maxBytes:MAX_EXPORT_BYTES}}
})
