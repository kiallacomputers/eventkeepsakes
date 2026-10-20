<script setup lang="ts">
definePageMeta({middleware:'auth'})
const route=useRoute(),client=useSupabaseClient(),dialog=useAppDialog()
const eventId=String(route.params.id)
const plans=ref<any[]>([]),storage=ref<any>(null),payments=ref<any[]>([]),error=ref(''),busy=ref(false),selected=ref('')
const money=(c:number,code='AUD')=>new Intl.NumberFormat('en-AU',{style:'currency',currency:code}).format(c/100)
const gb=(bytes:number)=>(bytes/1073741824).toFixed(1)
async function api<T>(url:string,opts:any={}){const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Please sign in again');return $fetch<T>(url,{...opts,headers:{...opts.headers,authorization:`Bearer ${session.access_token}`}})}
async function load(){error.value='';try{const [catalog,usage,history]=await Promise.all([$fetch<any>('/api/packages'),api<any>('/api/owner/storage',{query:{id:eventId}}),api<any>('/api/owner/payments',{query:{id:eventId}})]);plans.value=catalog.plans;storage.value=usage;payments.value=history.payments}catch(e:any){error.value=e?.data?.statusMessage||e.message}}
async function purchase(plan:any){if(busy.value)return;const yes=await dialog.confirm(`Purchase ${plan.display_name} for ${money(plan.price_cents,plan.currency)}? This is a one-time, full-price purchase; no automatic proration or refund.`, 'Confirm package purchase', 'Continue to Stripe');if(!yes)return;busy.value=true;error.value='';selected.value=plan.id;try{const response=await api<{url:string}>('/api/owner/checkout',{method:'POST',body:{eventId,planId:plan.id}});window.location.assign(response.url)}catch(e:any){error.value=e?.data?.statusMessage||e.message;busy.value=false;selected.value=''}}
onMounted(async()=>{await load();if(route.query.checkout==='success')dialog.show('Stripe checkout completed. Your package will appear here after payment confirmation. Refresh if necessary.','success');else if(route.query.checkout==='cancelled')dialog.show('Checkout cancelled. No package change was made.','info')})
</script>
<template>
<main class="mx-auto max-w-6xl space-y-6 px-5 py-10">
 <NuxtLink :to="`/dashboard/events/${eventId}`" class="ek-back-button inline-flex items-center gap-2 rounded-lg border border-[#D6B077] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold text-[#0C1D2D] shadow-sm transition hover:bg-[#F0E5D3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B18A50]"><span aria-hidden="true">←</span><span>Back</span></NuxtLink>
 <div class="flex flex-wrap items-center justify-between gap-3"><div><h1 class="text-3xl font-bold">Event Packages</h1><p class="text-sm text-[#536273]">Manage storage and retention for this event.</p></div><button class="btn" @click="load">Refresh</button></div>
 <p v-if="error" role="alert" class="text-red-700">{{error}}</p>
 <section v-if="storage" class="panel space-y-2"><h2 class="text-xl font-semibold">Current storage</h2><p>{{gb(storage.usedBytes)}} GB used of {{gb(storage.limitBytes)}} GB</p><p class="text-sm text-[#536273]">Status: {{storage.status}} · Expires: {{storage.expiresAt?new Date(storage.expiresAt).toLocaleDateString('en-AU'):'No expiry currently set'}}</p></section>
 <section class="grid gap-5 md:grid-cols-3"><article v-for="p in plans" :key="p.id" class="panel space-y-3"><h2 class="text-xl font-semibold">{{p.display_name}}</h2><p class="text-2xl font-bold text-[#0C1D2D]">{{money(p.price_cents,p.currency)}}</p><p>{{gb(p.storage_limit_bytes)}} GB storage</p><p>{{p.retention_days}} days retention</p><button class="btn w-full" :disabled="busy || (storage && p.storage_limit_bytes < storage.limitBytes)" @click="purchase(p)">{{selected===p.id?'Redirecting…':storage && p.storage_limit_bytes < storage.limitBytes?'Smaller than current plan':'Purchase package'}}</button></article></section>
 <section class="panel space-y-3"><h2 class="text-xl font-semibold">Payment history</h2><p v-if="!payments.length" class="text-sm text-[#536273]">No completed purchases yet.</p><div v-for="p in payments" :key="p.id" class="flex flex-wrap justify-between gap-2 border-t py-2 text-sm"><span>{{p.plan_id}} · {{new Date(p.paid_at).toLocaleDateString('en-AU')}}</span><span>{{money(p.amount_cents,p.currency)}}</span></div></section>
</main>
</template>
