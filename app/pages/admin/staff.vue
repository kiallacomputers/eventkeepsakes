<script setup lang="ts">
definePageMeta({middleware:'auth'})
const client=useSupabaseClient(),dialog=useAppDialog()
const staff=ref<any[]>([]),bootstrap=ref<string[]>([]),error=ref(''),busy=ref(false)
const newId=ref(''),newRole=ref('admin')
const users=ref<any[]>([]),userPage=ref(0),hasMore=ref(false),loadingUsers=ref(false),userFilter=ref('')
const availableUsers=computed(()=>users.value.filter(u=>`${u.email} ${u.id}`.toLowerCase().includes(userFilter.value.toLowerCase())))
async function loadUsers(reset=false){
 if(loadingUsers.value)return
 loadingUsers.value=true
 try{
  const page=reset?1:userPage.value+1
  const result=await api<any>('/api/admin/users',{query:{page}})
  users.value=reset?result.users:[...users.value,...result.users]
  userPage.value=page;hasMore.value=result.hasMore
 }catch(e:any){error.value=e?.data?.statusMessage||e.message}
 finally{loadingUsers.value=false}
}
async function api<T>(url:string,options:any={}){
 const {data:{session}}=await client.auth.getSession()
 if(!session)throw new Error('Sign in required')
 return $fetch<T>(url,{...options,headers:{...options.headers,Authorization:`Bearer ${session.access_token}`}})
}
async function load(){error.value='';try{const r=await api<any>('/api/admin/staff');staff.value=r.staff;bootstrap.value=r.bootstrapUserIds;await loadUsers(true)}catch(e:any){error.value=e?.data?.statusMessage||e.message}}
async function save(userId:string,role:string,active:boolean){
 if(!(await dialog.confirm(`Save ${role} access as ${active?'active':'disabled'} for ${userId}?`,'Confirm staff access')))return
 busy.value=true;error.value=''
 try{await api('/api/admin/staff',{method:'POST',body:{userId,role,active}});await load();dialog.show('Staff permissions saved.','success')}
 catch(e:any){error.value=e?.data?.statusMessage||e.message}finally{busy.value=false}
}
async function addMember(){await save(newId.value,newRole.value,true);if(!error.value)newId.value=''}
onMounted(load)
</script>
<template><main class="mx-auto max-w-5xl space-y-6 px-5 py-12">
<NuxtLink to="/admin" class="btn inline-flex">← Administration</NuxtLink>
<h1 class="text-3xl font-bold">Manage Staff</h1>
<p class="text-sm text-[#536273]">Assign Admin, Manager or SuperAdmin access to an existing registered EventKeepsakes user. Permissions are enforced on the server.</p>
<p v-if="error" role="alert" class="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">{{error}}</p>
<section class="panel space-y-3"><h2 class="text-xl font-semibold">Add existing user</h2>
<label class="block text-sm">Find a registered user<input v-model="userFilter" class="input mt-2 w-full" placeholder="Filter loaded users by email or ID"/></label>
<label class="block text-sm">Select user
<select v-model="newId" class="input mt-2 w-full">
<option value="">Choose a user…</option>
<option v-for="u in availableUsers" :key="u.id" :value="u.id" :disabled="u.assigned">
{{u.email}} — {{u.assigned?`Already assigned (${u.role}${u.active===false?', inactive':''})`:'Available'}}</option>
</select></label>
<div class="flex flex-wrap items-center gap-3 text-xs text-[#536273]">
<span>{{users.length}} registered users loaded; assigned staff are labelled and unavailable for new assignment.</span>
<button v-if="hasMore" class="btn" :disabled="loadingUsers" @click="loadUsers()">{{loadingUsers?'Loading…':'Load more users'}}</button>
</div>
<label class="block text-sm">Role<select v-model="newRole" class="input mt-2 w-full"><option value="admin">Admin</option><option value="manager">Manager</option><option value="superadmin">SuperAdmin</option></select></label>
<button class="btn" :disabled="busy||!newId" @click="addMember">Add staff member</button>
<p class="text-xs text-[#536273]">Only registered accounts appear. Already assigned users are labelled and disabled; edit their role under Current staff below. For large user lists, use Load more users.</p></section>
<section class="panel space-y-3"><h2 class="text-xl font-semibold">Current staff</h2>
<p v-if="!staff.length" class="text-sm">No database-managed staff yet. Existing bootstrap SuperAdmins are shown below.</p>
<div v-for="s in staff" :key="s.user_id" class="border-t py-3 space-y-2"><p class="font-semibold">{{s.email}}</p><p class="text-xs break-all text-[#536273]">{{s.user_id}}</p>
<div class="flex flex-wrap items-center gap-3"><select v-model="s.role" class="input" :disabled="bootstrap.includes(s.user_id)"><option value="admin">Admin</option><option value="manager">Manager</option><option value="superadmin">SuperAdmin</option></select><label class="text-sm flex items-center gap-2"><input v-model="s.active" type="checkbox" :disabled="bootstrap.includes(s.user_id)"/> Active</label><button class="btn" :disabled="busy||bootstrap.includes(s.user_id)" @click="save(s.user_id,s.role,s.active)">Save</button></div></div>
<div v-if="bootstrap.length" class="border-t pt-3"><p class="font-semibold">Environment bootstrap SuperAdmins</p><p class="text-xs text-[#536273]">These accounts retain access through EVENTKEEPSAKES_ADMIN_USER_IDS and cannot be downgraded here.</p><p v-for="id in bootstrap" :key="id" class="break-all text-xs mt-2">{{id}}</p></div>
</section></main></template>
