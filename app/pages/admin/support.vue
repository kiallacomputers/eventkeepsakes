<script setup lang="ts">
definePageMeta({middleware:'auth'})
const client=useSupabaseClient(),dialog=useAppDialog()
const tab=ref<'events'|'customers'>('events'),search=ref(''),page=ref(1),busy=ref(false),error=ref('')
const events=ref<any[]>([]),customers=ref<any[]>([]),total=ref(0),more=ref(false)
const selected=ref<any>(null),note=ref(''),saving=ref(false)
const edit=reactive({title:'',eventDate:'',status:'draft',uploadStartsAt:'',uploadEndsAt:'',reason:''})
const updating=ref(false)
const health=ref<any>(null),healthBusy=ref(false),healthError=ref('')
async function checkHealth(){
 if(!selected.value)return
 healthBusy.value=true;healthError.value=''
 try{health.value=await api<any>('/api/admin/support/health',{query:{id:selected.value.event.id}})}
 catch(e:any){healthError.value=message(e)}
 finally{healthBusy.value=false}
}
function applySuggestion(key:string){
 if(!health.value)return
 if(key==='status')edit.status='active'
 if(key==='window'){
  const start=new Date()
  const end=new Date(start.getTime()+7*86400000)
  if(!edit.uploadStartsAt)edit.uploadStartsAt=toLocal(start.toISOString())
  if(!edit.uploadEndsAt||new Date(edit.uploadEndsAt).getTime()<Date.now())edit.uploadEndsAt=toLocal(end.toISOString())
 }
 document.getElementById('support-event-edit')?.scrollIntoView({behavior:'smooth'})
}
function toLocal(v:string|null){if(!v)return '';const d=new Date(v);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function fromLocal(v:string){return v?new Date(v).toISOString():null}
function initEdit(e:any){
 edit.title=e.title||'';edit.eventDate=e.event_date||'';edit.status=e.status||'draft'
 edit.uploadStartsAt=toLocal(e.upload_starts_at);edit.uploadEndsAt=toLocal(e.upload_ends_at);edit.reason=''
}
async function saveEvent(){
 if(!selected.value||updating.value)return
 if(edit.reason.trim().length<10){error.value='Enter a reason of at least 10 characters';return}
 if(edit.uploadStartsAt&&edit.uploadEndsAt&&edit.uploadStartsAt>=edit.uploadEndsAt){error.value='Upload end must be after start';return}
 const approved=await dialog.confirm(`Update "${selected.value.event.title}"?\n\nStatus: ${edit.status}\nReason: ${edit.reason}`, 'Confirm event change', 'Save changes')
 if(!approved)return
 updating.value=true;error.value=''
 try{
  const id=selected.value.event.id
  await api('/api/admin/support/update',{method:'POST',body:{
   eventId:id,title:edit.title,eventDate:edit.eventDate||null,status:edit.status,
   uploadStartsAt:fromLocal(edit.uploadStartsAt),uploadEndsAt:fromLocal(edit.uploadEndsAt),reason:edit.reason
  }})
  await openEvent(id);await load()
  dialog.show('Event updated and audit history recorded.','success')
 }catch(e:any){error.value=message(e)}finally{updating.value=false}
}
async function api<T>(url:string,options:any={}):Promise<T>{
 const {data:{session}}=await client.auth.getSession()
 if(!session)throw new Error('Sign in required')
 return await $fetch<T>(url,{...options,headers:{...options.headers,Authorization:`Bearer ${session.access_token}`}})
}
function message(e:any){return e?.data?.statusMessage||e?.message||'Request failed'}
async function load(){
 busy.value=true;error.value=''
 try{
  if(tab.value==='events'){
   const r=await api<any>('/api/admin/support/events',{query:{page:page.value,search:search.value}})
   events.value=r.items;total.value=r.total
  }else{
   const r=await api<any>('/api/admin/support/customers',{query:{page:page.value,search:search.value}})
   customers.value=r.items;more.value=r.hasMore
  }
 }catch(e:any){error.value=message(e)}finally{busy.value=false}
}
async function openEvent(id:string){
 error.value=''
 try{selected.value=await api<any>('/api/admin/support/event',{query:{id}});initEdit(selected.value.event);health.value=null;await checkHealth()}
 catch(e:any){error.value=message(e)}
}
async function saveNote(){
 if(!selected.value||!note.value.trim())return
 saving.value=true
 try{
  await api('/api/admin/support/note',{method:'POST',body:{eventId:selected.value.event.id,note:note.value}})
  note.value='';await openEvent(selected.value.event.id)
  dialog.show('Support note saved.','success')
 }catch(e:any){error.value=message(e)}finally{saving.value=false}
}
function switchTab(value:'events'|'customers'){tab.value=value;page.value=1;search.value='';selected.value=null;load()}
function searchNow(){page.value=1;selected.value=null;load()}
onMounted(load)
</script>
<template>
<main class="mx-auto max-w-6xl px-5 py-10 space-y-5">
<NuxtLink to="/admin" class="btn inline-flex">← Administration</NuxtLink>
<h1 class="text-3xl font-bold">Customer &amp; Event Support</h1>
<p class="text-[#536273]">Staff-only support tools. Customer media remains private; support staff cannot browse or download uploaded photos and videos here.</p>
<div class="flex flex-wrap gap-2">
<button class="btn" :aria-pressed="tab==='events'" @click="switchTab('events')">Events</button>
<button class="btn" :aria-pressed="tab==='customers'" @click="switchTab('customers')">Customers</button>
</div>
<section class="panel space-y-3">
<form class="flex flex-wrap gap-2" @submit.prevent="searchNow">
<input v-model="search" class="input flex-1 min-w-52" :placeholder="tab==='events'?'Search event title or exact event/user ID':'Filter users on the current page by email'"/>
<button class="btn" type="submit" :disabled="busy">Search</button>
</form>
<p v-if="error" class="text-red-700" role="alert">{{error}}</p>
<p v-if="busy">Loading…</p>
<template v-if="tab==='events'">
<p class="text-sm text-[#536273]">{{total}} matching events</p>
<div v-for="e in events" :key="e.id" class="border-t py-3 flex flex-wrap items-center justify-between gap-3">
<div><p class="font-semibold">{{e.title}}</p><p class="text-xs text-[#536273]">{{e.status}} · {{e.event_date||'No event date'}} · Expires {{e.retention?.expires_at?new Date(e.retention.expires_at).toLocaleDateString():'Not set'}}</p></div>
<button class="btn" @click="openEvent(e.id)">View support record</button>
</div>
<div class="flex gap-2"><button class="btn" :disabled="busy||page===1" @click="page--;load()">Previous</button><span class="py-2">Page {{page}}</span><button class="btn" :disabled="busy||page*25>=total" @click="page++;load()">Next</button></div>
</template>
<template v-else>
<p class="text-xs text-[#536273]">Users are loaded in pages of 100. Email filtering applies to the current page only.</p>
<div v-for="u in customers" :key="u.id" class="border-t py-3">
<p class="font-semibold">{{u.email||'No email'}}</p><p class="text-xs text-[#536273] break-all">User: {{u.id}} · Events: {{u.eventCount}} · Registered {{new Date(u.created_at).toLocaleDateString()}}</p>
<button class="btn mt-2" @click="tab='events';search=u.id;page=1;load()">Find events</button>
</div>
<div class="flex gap-2"><button class="btn" :disabled="busy||page===1" @click="page--;load()">Previous</button><span class="py-2">Page {{page}}</span><button class="btn" :disabled="busy||!more" @click="page++;load()">Next</button></div>
</template>
</section>
<section v-if="selected" class="panel space-y-3">
<div class="flex justify-between items-start gap-3"><h2 class="text-2xl font-semibold">{{selected.event.title}}</h2><button class="btn" @click="selected=null">Close</button></div>
<p class="text-sm">Customer: {{selected.owner.email}}</p>
<p class="text-sm">Event status: {{selected.event.status}} · Upload window: {{selected.event.upload_starts_at||'Not set'}} – {{selected.event.upload_ends_at||'Not set'}}</p>
<p class="text-sm">Storage limit: {{selected.entitlement?Math.round(Number(selected.entitlement.storage_limit_bytes)/1073741824*100)/100+' GB':'Not set'}} · Retention expiry: {{selected.entitlement?.expires_at||'Not set'}}</p>
<p class="text-xs text-[#536273] break-all">Event ID: {{selected.event.id}}</p>

<div class="border-t pt-5 space-y-3">
<h3 class="text-xl font-semibold">Edit event details</h3>
<p class="text-sm text-[#536273]">Changes require a reason and are recorded in the audit history. This does not extend purchased retention or storage.</p>
<label class="block text-sm">Event name<input v-model="edit.title" class="input mt-1 w-full" maxlength="200"/></label>
<label class="block text-sm">Event date<input v-model="edit.eventDate" type="date" class="input mt-1 w-full"/></label>
<label class="block text-sm">Status<select v-model="edit.status" class="input mt-1 w-full">
<option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="closed">Closed</option>
</select></label>
<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
<label class="block text-sm">Guest upload starts<input v-model="edit.uploadStartsAt" type="datetime-local" class="input mt-1 w-full"/></label>
<label class="block text-sm">Guest upload ends<input v-model="edit.uploadEndsAt" type="datetime-local" class="input mt-1 w-full"/></label>
</div>
<label class="block text-sm">Reason for change (required)<textarea v-model="edit.reason" class="input mt-1 w-full" rows="3" maxlength="1000" placeholder="Explain the customer request and what changed…"/></label>
<button class="btn" :disabled="updating||edit.reason.trim().length<10" @click="saveEvent">{{updating?'Saving…':'Review & save changes'}}</button>
</div>
<div class="border-t pt-5 space-y-3">
<h3 class="text-xl font-semibold">Change history</h3>
<p v-if="!selected.audit?.length" class="text-sm">No administrative changes recorded.</p>
<div v-for="a in selected.audit||[]" :key="a.id" class="border-t pt-3 text-sm">
<p class="font-semibold">{{new Date(a.created_at).toLocaleString()}} · {{a.action}}</p>
<p class="whitespace-pre-wrap">{{a.reason}}</p>
<details class="mt-2"><summary class="cursor-pointer">View before / after</summary>
<pre class="whitespace-pre-wrap break-all text-xs">{{JSON.stringify({before:a.before_values,after:a.after_values},null,2)}}</pre>
</details>
<p class="text-xs text-[#536273]">Staff {{a.staff_user_id}}</p>
</div>
</div>
<h3 class="font-semibold">Support notes</h3>
<p v-if="!selected.notes.length" class="text-sm">No support notes yet.</p>
<div v-for="n in selected.notes" :key="n.id" class="border-t pt-2">
<p class="whitespace-pre-wrap">{{n.note}}</p><p class="text-xs text-[#536273]">{{new Date(n.created_at).toLocaleString()}} · Staff {{n.staff_user_id}}</p>
</div>
<label class="block text-sm">Add support note<textarea v-model="note" class="input mt-2 w-full" maxlength="2000" rows="3" placeholder="Record the issue and any steps taken…"/></label>
<button class="btn" :disabled="saving||!note.trim()" @click="saveNote">Save note</button>
<p class="text-xs text-[#536273]">Notes are visible to authorised staff, not customers. Do not record passwords, PINs or sensitive personal details.</p>
</section>
</main>
</template>
