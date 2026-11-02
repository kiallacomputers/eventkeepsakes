<script setup lang="ts">
definePageMeta({middleware:'auth'})
const client=useSupabaseClient(),dialog=useAppDialog()
const templates=ref<any[]>([]),busy=ref(false),error=ref(''),statusFilter=ref('all')
const filtered=computed(()=>templates.value.filter(t=>statusFilter.value==='all'||t.status===statusFilter.value))
async function headers(){const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in required');return {authorization:`Bearer ${session.access_token}`}}
async function load(){error.value='';try{templates.value=(await $fetch<any>('/api/admin/sign-templates',{headers:await headers()})).templates}catch(e:any){error.value=e?.data?.statusMessage||e.message}}
async function save(t:any){busy.value=true;error.value='';try{await $fetch('/api/admin/sign-templates',{method:'POST',headers:await headers(),body:{id:t.id,name:t.name,category:t.category,status:t.status}});dialog.show('Template updated.','success');await load()}catch(e:any){error.value=e?.data?.statusMessage||e.message}finally{busy.value=false}}
async function upload(t:any,e:Event){const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;busy.value=true;error.value='';try{const form=new FormData();form.append('id',t.id);form.append('image',file);await $fetch('/api/admin/sign-template-background',{method:'POST',headers:await headers(),body:form});dialog.show('Template artwork uploaded.','success');await load()}catch(e:any){error.value=e?.data?.statusMessage||e.message}finally{busy.value=false}}
onMounted(load)
const categories=['wedding','birthday','celebration','christening','baby','graduation','corporate','anniversary','memorial','other']
</script>
<template>
 <section class="space-y-5 py-5">
  <div><h2 class="text-2xl font-semibold">Sign Template Manager</h2><p class="text-sm text-[#536273] mt-2">Review owner submissions, publish designs, assign categories and upload artwork. Only published templates appear for all event owners.</p></div>
  <div class="flex flex-wrap gap-2 items-center"><label class="text-sm">Status <select v-model="statusFilter" class="input ml-2"><option value="all">All</option><option value="pending">Pending review</option><option value="published">Published</option><option value="personal">Personal</option><option value="archived">Archived</option></select></label><button class="btn" @click="load">Refresh</button></div>
  <p v-if="error" class="text-red-700" role="alert">{{error}}</p>
  <p v-if="!filtered.length" class="text-sm text-[#536273]">No layouts in this section yet. Event owners can save a layout and submit it here.</p>
  <article v-for="t in filtered" :key="t.id" class="panel grid gap-4 md:grid-cols-[180px_1fr]">
   <div class="rounded-lg bg-[#F4E9D8] min-h-48 flex items-center justify-center"><img v-if="t.background_url" :src="t.background_url" alt="Template background" class="max-h-64 w-full object-contain"/><span v-else class="text-sm text-center p-4">No background uploaded</span></div>
   <div class="space-y-3">
    <div class="flex flex-wrap justify-between gap-2"><strong>{{t.name}}</strong><span class="text-xs uppercase text-[#536273]">{{t.status}} · {{t.id.slice(0,8)}}</span></div>
    <label class="block text-sm">Template name<input v-model="t.name" maxlength="80" class="input mt-1 w-full"/></label>
    <div class="grid grid-cols-2 gap-2"><label class="text-sm">Category<select v-model="t.category" class="input mt-1 w-full"><option v-for="c in categories" :key="c" :value="c">{{c}}</option></select></label><label class="text-sm">Visibility<select v-model="t.status" class="input mt-1 w-full"><option value="personal">Personal</option><option value="pending">Pending review</option><option value="published" :disabled="!t.can_publish">Published</option><option value="archived">Archived</option></select></label></div>
    <p v-if="!t.can_publish" class="text-xs text-amber-800">Owner has not granted permission for public use. Do not publish without consent.</p>
    <label class="block text-sm">Upload blank template background (PNG, JPG or WebP, max 12 MB)<input type="file" accept="image/png,image/jpeg,image/webp" class="mt-2 block w-full text-xs" :disabled="busy" @change="upload(t,$event)"/></label>
    <p class="text-xs text-[#536273]">Upload background art without baked-in names or QR codes. The owner's saved layout supplies the editable fonts, colours and content positions.</p>
    <button class="btn" :disabled="busy" @click="save(t)">Save template</button>
   </div>
  </article>
 </section>
</template>
