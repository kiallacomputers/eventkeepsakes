<script setup lang="ts">
definePageMeta({middleware:'auth'})
const client=useSupabaseClient(),dialog=useAppDialog()
const isSuperAdmin=ref(false)
const loading=ref(true),saving=ref(false),error=ref(''),report=ref<any>(null)
const money=(n:number)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n||0)
async function headers(){const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in required');return {authorization:`Bearer ${session.access_token}`}}
async function load(){loading.value=true;error.value='';try{report.value=await $fetch('/api/admin/finance',{headers:await headers()})}catch(e:any){error.value=e?.data?.statusMessage||e.message||'Unable to load financial report'}finally{loading.value=false}}
async function save(){if(!report.value)return;saving.value=true;error.value='';try{await $fetch('/api/admin/finance',{method:'POST',headers:await headers(),body:report.value.settings});dialog.show('Financial settings saved.','success');await load()}catch(e:any){error.value=e?.data?.statusMessage||e.message||'Could not save'}finally{saving.value=false}}
const inputs=[
 ['usd_to_aud','USD to AUD exchange rate'],['supabase_usd_month','Supabase (USD/month)'],['railway_usd_month','Railway base (USD/month)'],['railway_included_gb','Railway included GB'],['railway_overage_usd_gb','Railway overage (USD/GB/month)'],['domain_aud_year','Domain (AUD/year)'],['other_aud_month','Other costs (AUD/month)'],['variable_aud_event','Other variable cost (AUD/sale)'],['stripe_percent','Estimated Stripe fee (%)'],['stripe_fixed_aud','Estimated Stripe fixed fee (AUD)'],['annual_event_target','Annual sales target']
] as const
const progress=computed(()=>report.value?Math.min(100,Math.round(report.value.summary.sales/report.value.settings.annual_event_target*100)):0)
onMounted(async()=>{try{const {role}=await $fetch<{role:string}>('/api/admin/me',{headers:await headers()});isSuperAdmin.value=role==='superadmin'}catch{};await load()})
</script>
<template>
<main class="mx-auto max-w-6xl space-y-6 px-5 py-10">
 <NuxtLink to="/admin" class="ek-back-button inline-flex rounded-lg border border-[#D6B077] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold">← Back to Administration</NuxtLink>
 <div><h1 class="text-3xl font-bold">EventKeepsakes Financial Dashboard</h1><p class="mt-2 text-sm text-[#536273]">Sales from completed package payments · operating estimates in Australian dollars</p></div>
 <p v-if="error" role="alert" class="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">{{error}}</p>
 <p v-if="loading">Loading financial dashboard…</p>
 <template v-else-if="report">
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
   <div class="panel"><p class="text-sm text-[#536273]">{{report.year}} revenue</p><p class="text-2xl font-bold">{{money(report.summary.revenue)}}</p></div>
   <div class="panel"><p class="text-sm text-[#536273]">Paid transactions</p><p class="text-2xl font-bold">{{report.summary.sales}}</p></div>
   <div class="panel"><p class="text-sm text-[#536273]">Annual fixed expenses</p><p class="text-2xl font-bold">{{money(report.summary.fixedYear)}}</p></div>
   <div class="panel"><p class="text-sm text-[#536273]">Estimated annual profit</p><p class="text-2xl font-bold" :class="report.summary.profit>=0?'text-emerald-700':'text-red-700'">{{money(report.summary.profit)}}</p></div>
  </div>
  <section class="panel space-y-3"><h2 class="text-xl font-semibold">Sales target & break-even</h2><p>{{report.summary.sales}} of {{report.settings.annual_event_target}} annual sales · {{progress}}%</p><div class="h-3 rounded-full bg-[#E8DDC8] overflow-hidden"><div class="h-full bg-[#B18A50]" :style="{width:progress+'%'}"/></div><p>Estimated break-even: <strong>{{report.summary.breakEven===null?'Not enough sales data':report.summary.breakEven+' paid transactions/year'}}</strong></p><p class="text-sm text-[#536273]">Break-even uses your actual average contribution per paid transaction so far, assuming the current mix continues.</p></section>
  <section class="panel space-y-3"><h2 class="text-xl font-semibold">Annual cost breakdown</h2><div class="grid gap-2 sm:grid-cols-2"><p>Estimated Stripe fees: <strong>{{money(report.summary.stripeFees)}}</strong></p><p>Variable expenses: <strong>{{money(report.summary.variable)}}</strong></p><p>GST allowance: <strong>{{money(report.summary.gst)}}</strong></p><p>Fixed infrastructure & other expenses: <strong>{{money(report.summary.fixedYear)}}</strong></p></div></section>
  <section class="panel space-y-3"><h2 class="text-xl font-semibold">Monthly paid sales</h2><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b text-left"><th class="p-2">Month</th><th class="p-2">Payments</th><th class="p-2">Revenue</th></tr></thead><tbody><tr v-for="m in report.months" :key="m.month" class="border-b"><td class="p-2">{{m.month}}</td><td class="p-2">{{m.events}}</td><td class="p-2">{{money(m.revenue)}}</td></tr></tbody></table></div></section>
  <section class="panel space-y-3"><h2 class="text-xl font-semibold">Revenue by package</h2><p v-if="!report.byPlan.length" class="text-sm">No completed payments recorded this year.</p><div v-for="p in report.byPlan" :key="p.planId" class="flex justify-between gap-3 border-b py-2"><span>{{p.planId}} · {{p.sales}} sales</span><strong>{{money(p.revenue)}}</strong></div></section>
  <section class="panel space-y-4"><h2 class="text-xl font-semibold">Business settings</h2><p class="text-sm text-[#536273]">SuperAdmin-only settings (read-only for Managers). USD costs are converted to AUD using the exchange rate below.</p><div class="grid gap-4 md:grid-cols-2"><label v-for="[key,label] in inputs" :key="key" class="block text-sm">{{label}}<input v-model.number="report.settings[key]" :disabled="!isSuperAdmin" type="number" min="0" step="any" class="input mt-1 w-full" /></label></div><label class="flex items-center gap-3 text-sm"><input v-model="report.settings.gst_registered" :disabled="!isSuperAdmin" type="checkbox"/> Registered for GST (currently off)</label><button v-if="isSuperAdmin" class="btn" :disabled="saving" @click="save">{{saving?'Saving…':'Save financial settings'}}</button></section>
  <section class="panel space-y-2"><h2 class="text-xl font-semibold">Important reporting notes</h2><p v-for="note in report.notes" :key="note" class="text-sm text-[#536273]">• {{note}}</p><p v-if="report.summary.excludedCurrencies" class="text-sm text-amber-700">{{report.summary.excludedCurrencies}} transactions use unsupported currencies and are excluded from AUD totals.</p><p v-if="report.summary.hasMorePayments" class="text-sm text-amber-700">Payment history limit reached: report may be incomplete.</p><p class="text-sm text-[#536273]">Profit is an estimate, not accounting advice or a reconciled profit-and-loss statement. No live Railway usage or refunds feed is connected yet.</p></section>
 </template>
</main>
</template>
