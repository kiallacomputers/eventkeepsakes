import {requirePackageAdmin} from '../../utils/payments'
import {getRetentionSettings} from '../../utils/retention'
export default defineEventHandler(async event=>{
 await requirePackageAdmin(event)
 const settings=await getRetentionSettings()
 return {subject:'Your EventKeepsakes event is approaching expiry',template:'Your event media is nearing its retention expiry. Sign in to EventKeepsakes to review your event and download your photos and videos.',reminderDays:settings.reminder_days,emailsEnabled:false}
})
