<script setup lang="ts">
definePageMeta({middleware:'auth'})
const client=useSupabaseClient(),dialog=useAppDialog()
const plans=ref<any[]>([]),error=ref(''),busy=ref(false)
async function api<T>(url:string,opts:any={}){const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in required');return $fetch<T>(url,{...opts,headers:{...opts.headers,authorization:`Bearer ${session.access_token}`}})}
async function load(){error.value='';try{plans.value=(await api<{plans:any[]}>('/api/admin/retention-plans')).plans}catch(e:any){error.value=e?.data?.statusMessage||e.message}}
function addPlan(){plans.value.push({id:'',display_name:'',extension_days:90,price_cents:1900,currency:'AUD',active:false,sort_order:plans.value.length*10})}
async function save(p:any){busy.value=true;error.value='';try{await api('/api/admin/retention-plans',{method:'POST',body:p});dialog.show('Retention price saved. New checkouts use this price.','success');await load()}catch(e:any){error.value=e?.data?.statusMessage||e.message}finally{busy.value=false}}
onMounted(load)
</script>
<template><main class="mx-auto max-w-5xl space-y-6 px-5 py-10">
<NuxtLink to="/admin/retention" class="btn inline-flex">← Retention &amp; Recovery</NuxtLink>
<div class="flex flex-wrap items-center justify-between gap-3"><h1 class="text-3xl font-bold">Retention Extension Pricing</h1><button class="btn" @click="addPlan">Add option</button></div>
<p class="text-sm text-[#536273]">Configure one-time retention extension purchases. Prices are in cents; 1900 = $19.00. Changes affect new checkouts only.</p>
<p v-if="error" role="alert" class="text-red-700">{{error}}</p>
<article v-for="(p,i) in plans" :key="i" class="panel grid gap-3 md:grid-cols-3">
<label class="text-sm">Option ID<input v-model="p.id" :disabled="!!p.updated_at" class="input mt-1 w-full"/></label>
<label class="text-sm">Display name<input v-model="p.display_name" class="input mt-1 w-full"/></label>
<label class="text-sm">Additional days<input v-model.number="p.extension_days" type="number" min="1" max="3650" class="input mt-1 w-full"/></label>
<label class="text-sm">Price (cents)<input v-model.number="p.price_cents" type="number" min="1" class="input mt-1 w-full"/></label>
<label class="text-sm">Currency<input v-model="p.currency" class="input mt-1 w-full"/></label>
<label class="text-sm">Display order<input v-model.number="p.sort_order" type="number" min="0" class="input mt-1 w-full"/></label>
<label class="flex items-center gap-2 text-sm"><input v-model="p.active" type="checkbox"/> Available for purchase</label>
<button class="btn" :disabled="busy" @click="save(p)">Save option</button>
</article></main></template>
