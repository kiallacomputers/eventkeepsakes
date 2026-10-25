<script setup lang="ts">
definePageMeta({middleware:'auth'})
const client=useSupabaseClient()
const rows=ref<any[]>([]),summary=ref<any>(null),error=ref(''),loading=ref(true),truncated=ref(false),checkedAt=ref('')
const filter=ref('all')
const gb=(n:number|null)=>n===null?'—':(n/1073741824).toFixed(2)+' GB'
const visible=computed(()=>rows.value.filter(x=>filter.value==='all'||x.level===filter.value))
async function load(){
 loading.value=true;error.value=''
 try{
  const {data}=await client.auth.getSession()
  const result=await $fetch<any>('/api/admin/storage-monitor',{headers:{Authorization:`Bearer ${data.session?.access_token||''}`}})
  rows.value=result.events;summary.value=result.summary;truncated.value=result.truncated;checkedAt.value=result.checkedAt
 }catch(e:any){error.value=e?.data?.statusMessage||e?.message||'Unable to load storage'}
 finally{loading.value=false}
}
onMounted(load)
</script>
<template>
<div class="mx-auto max-w-6xl px-5 py-12 space-y-5">
 <NuxtLink to="/admin" class="btn inline-flex">← Administration</NuxtLink>
 <div class="flex flex-wrap items-center justify-between gap-3"><div>
  <h1 class="text-3xl font-bold">Storage Monitoring</h1>
  <p class="mt-2 text-[#536273]">Capacity warnings for event storage entitlements.</p>
 </div><button class="btn" :disabled="loading" @click="load">Refresh</button></div>
 <p v-if="error" class="text-red-700" role="alert">{{error}}</p>
 <p v-if="loading">Checking storage…</p>
 <template v-else-if="summary">
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
   <div v-for="m in [{label:'Events checked',value:summary.total},{label:'85–99% full',value:summary.nearLimit},{label:'At or over limit',value:summary.atLimit},{label:'Usage unknown',value:summary.unknown}]" :key="m.label" class="panel">
    <p class="text-2xl font-bold">{{m.value}}</p><p class="text-sm text-[#536273]">{{m.label}}</p>
   </div>
  </div>
  <p v-if="truncated" class="rounded-lg border border-amber-400 p-3 text-sm" role="alert">Results are incomplete due to safety limits (500 entitlements / 10,000 media records). Usage may be shown as unknown. Do not use this view for billing decisions.</p>
  <p class="text-xs text-[#536273]">Checked {{new Date(checkedAt).toLocaleString('en-AU')}} · Warnings start at 85% · Read-only monitoring</p>
  <label class="block text-sm">Show
   <select v-model="filter" class="input ml-2"><option value="all">All</option><option value="full">Full</option><option value="warning">Near limit</option><option value="unknown">Unknown</option><option value="ok">Healthy</option></select>
  </label>
  <div class="overflow-x-auto"><table class="w-full text-left text-sm">
   <thead><tr><th class="p-2">Event</th><th class="p-2">Used</th><th class="p-2">Limit</th><th class="p-2">Usage</th><th class="p-2">Status</th><th class="p-2">Action</th></tr></thead>
   <tbody><tr v-for="e in visible" :key="e.eventId" class="border-t">
    <td class="p-2">{{e.title}}</td><td class="p-2">{{gb(e.usedBytes)}}</td><td class="p-2">{{gb(e.limitBytes)}}</td>
    <td class="p-2">{{e.percent===null?'Unknown':e.percent+'%'}}</td><td class="p-2">{{e.level}}</td>
    <td class="p-2"><NuxtLink class="underline" to="/admin/support">Open support</NuxtLink></td>
   </tr></tbody>
  </table></div>
 </template>
</div>
</template>
