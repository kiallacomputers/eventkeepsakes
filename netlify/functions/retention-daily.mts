import {createClient} from '@supabase/supabase-js'

// Netlify Scheduled Function. 02:00 UTC daily (13:00 AEDT / 12:00 AEST).
export const config = {schedule: '0 2 * * *'}

export default async function () {
  const url = process.env.SUPABASE_URL
  const key = process.env.EVENTKEEPSAKES_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Retention scan credentials missing')
  const db = createClient(url, key, {auth:{autoRefreshToken:false,persistSession:false}})
  // DRY RUN is the safe default. Only the exact value "queue" enables
  // reminder-queue writes. Neither mode deletes media or sends emails.
  const dryRun = process.env.EVENTKEEPSAKES_RETENTION_MODE !== 'queue'
  const {data,error} = await db.rpc('run_daily_retention_scan',{p_dry_run:dryRun})
  if(error) throw new Error(`Retention scan failed: ${error.message}`)
  console.log('[retention-daily]',JSON.stringify(data))
  return new Response(JSON.stringify({ok:true,...data}),{
    status:200,headers:{'content-type':'application/json'}
  })
}
