import {activePlans} from '../../utils/payments'
export default defineEventHandler(async()=>({plans:(await activePlans()).filter(p=>p.price_cents>0 && p.retention_days)}))
