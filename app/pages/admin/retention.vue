<script setup lang="ts">
definePageMeta({middleware:'auth'})
const client=useSupabaseClient()
const dialog=useAppDialog()
const loading=ref(true)
const busy=ref(false)
const error=ref('')
const settings=ref<any>(null)
const events=ref<any[]>([])
const reminders=ref<any[]>([])
const audits=ref<any[]>([])
const reminderText=ref('30,14,7')
async function headers(){
 const {data}=await client.auth.getSession()
 return {Authorization:`Bearer ${data.session?.access_token||''}`}
}
async function refresh(){
 loading.value=true;error.value=''
 try{
  const data=await $fetch<any>('/api/admin/retention',{headers:await headers()})
  settings.value=data.settings;events.value=data.events;reminders.value=data.reminders;audits.value=data.audits
  reminderText.value=data.settings.reminder_days.join(', ')
 }catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to load retention'}
 finally{loading.value=false}
}
async function save(){
 busy.value=true;error.value=''
 try{
  const days=reminderText.value.split(',').map(x=>Number(x.trim()))
  if(days.some(x=>!Number.isInteger(x)||x<1||x>365)) throw new Error('Use comma-separated whole numbers from 1 to 365.')
  await $fetch('/api/admin/retention',{method:'POST',headers:await headers(),body:{
   reminder_days:days,recovery_days:Number(settings.value.recovery_days),
   reminders_enabled:settings.value.reminders_enabled,automatic_deletion_enabled:false
  }})
  await refresh()
  dialog.show('Retention settings saved. Automatic deletion remains disabled.','success')
 }catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Save failed'}
 finally{busy.value=false}
}
async function scan(){
 busy.value=true;error.value=''
 try{
  const result=await $fetch<any>('/api/admin/retention-scan',{method:'POST',headers:await headers()})
  await refresh()
  dialog.show(result.note,'success')
 }catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Scan failed'}
 finally{busy.value=false}
}
onMounted(refresh)
</script>
<template>
<div class="mx-auto max-w-6xl px-5 py-12 space-y-6">
 <NuxtLink to="/admin" class="btn inline-flex">← SuperAdmin</NuxtLink>
 <div><h1 class="text-3xl font-bold">Retention &amp; Recovery</h1><p class="mt-2 text-[#536273]">Manage retention policies and review upcoming event expiries.</p></div>
 <p v-if="error" class="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{{error}}</p>
 <p v-if="loading">Loading…</p>
 <template v-else-if="settings">
  <section class="panel space-y-4">
   <h2 class="text-xl font-semibold">Global retention settings</h2>
   <label class="block">Reminder days before expiry (comma separated)
    <input v-model="reminderText" class="input mt-2" placeholder="30,14,7" />
   </label>
   <label class="block">Recovery period (days)
    <input v-model.number="settings.recovery_days" type="number" min="1" max="365" class="input mt-2"/>
   </label>
   <label class="flex items-center gap-2"><input v-model="settings.reminders_enabled" type="checkbox"/> Queue reminders during manual scans</label>
   <p class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><strong>Automatic deletion OFF.</strong> This version only reports retention phases and queues reminders. It does not send emails, recover files or delete media.</p>
   <div class="flex flex-wrap gap-3"><button class="btn" :disabled="busy" @click="save">Save settings</button><button class="btn" :disabled="busy" @click="scan">Run expiry scan</button></div>
  </section>
  <section class="panel space-y-3"><h2 class="text-xl font-semibold">Event expiry overview</h2><p class="text-sm text-[#536273]">First 200 records ordered by expiry date.</p>
   <div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead><tr><th class="p-2">Event</th><th class="p-2">Expires</th><th class="p-2">Status</th><th class="p-2">Recovery ends</th></tr></thead>
    <tbody><tr v-for="e in events" :key="e.event_id" class="border-t"><td class="p-2">{{e.title}}</td><td class="p-2">{{e.expires_at?new Date(e.expires_at).toLocaleDateString('en-AU'):'Not set'}}</td><td class="p-2">{{e.phase.replaceAll('_',' ')}}</td><td class="p-2">{{e.recoveryEndsAt?new Date(e.recoveryEndsAt).toLocaleDateString('en-AU'):'—'}}</td></tr></tbody>
   </table></div>
  </section>
  <section class="panel space-y-2"><h2 class="text-xl font-semibold">Reminder queue</h2><p class="text-sm text-[#536273]">Queued only; email delivery is not yet configured.</p><p v-if="!reminders.length">No reminders queued.</p><p v-for="r in reminders" :key="r.id" class="text-sm">{{r.event_id}} · {{r.days_before}} days · {{r.status}}</p></section>
  <section class="panel space-y-2"><h2 class="text-xl font-semibold">Recent audit activity</h2><p v-if="!audits.length">No activity yet.</p><p v-for="a in audits" :key="a.id" class="text-sm">{{new Date(a.created_at).toLocaleString('en-AU')}} · {{a.action}}</p></section>
 </template>
</div>
</template>
