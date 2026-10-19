<script setup lang="ts">
definePageMeta({middleware:'auth'})
const route=useRoute(),client=useSupabaseClient()
const eventId=String(route.params.id)
const media=ref<any[]>([]),busy=ref(false),error=ref(''),notice=ref('')
async function api<T>(path:string,options:any={}){
 const {data:{session}}=await client.auth.getSession()
 if(!session)throw new Error('Please sign in again')
 return $fetch<T>(path,{...options,headers:{...options.headers,authorization:`Bearer ${session.access_token}`}})
}
async function load(){busy.value=true;error.value='';try{
 const data=await api<{media:any[]}>('/api/owner/media',{query:{id:eventId}})
 media.value=data.media
}catch(e:any){error.value=e?.data?.statusMessage||e.message}finally{busy.value=false}}
async function change(mediaId:string,action:'approve'|'reject'|'delete'){
 if(action==='delete'&&!confirm('Permanently delete this file?'))return
 busy.value=true;error.value='';notice.value=''
 try{await api('/api/owner/media',{method:'POST',body:{eventId,mediaId,action}});notice.value='Media updated.';await load()}
 catch(e:any){error.value=e?.data?.statusMessage||e.message}finally{busy.value=false}
}
onMounted(load)
</script>
<template>
 <main class="mx-auto max-w-6xl px-5 py-10 space-y-6">
  <NuxtLink :to="`/dashboard/events/${eventId}`" class="text-[#90612E]">← Event settings</NuxtLink>
  <div class="flex flex-wrap items-center justify-between gap-4"><h1 class="text-3xl font-bold">Guest uploads</h1><button class="btn" :disabled="busy" @click="load">Refresh</button></div>
  <p v-if="error" class="text-red-700" role="alert">{{error}}</p><p v-if="notice" class="text-green-800" role="status">{{notice}}</p>
  <p v-if="!media.length" class="panel">{{busy?'Loading uploads…':'No completed uploads yet.'}}</p>
  <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
   <article v-for="m in media" :key="m.id" class="panel space-y-3">
    <img v-if="m.media_type==='image'&&m.url" :src="m.url" alt="Uploaded event photo" class="aspect-video w-full rounded-lg object-cover" />
    <video v-else-if="m.url" :src="m.url" controls playsinline class="aspect-video w-full rounded-lg bg-black object-contain" />
    <p class="break-all text-sm font-semibold">{{m.original_name}}</p>
    <p class="text-xs text-[#536273]">{{m.contributor_name||'Anonymous'}} · {{(m.size_bytes/1048576).toFixed(1)}} MB · {{m.status}}</p>
    <div class="flex flex-wrap gap-2"><button v-if="m.status!=='approved'" class="btn text-sm" :disabled="busy" @click="change(m.id,'approve')">Approve</button><button v-if="m.status!=='rejected'" class="text-sm text-[#90612E]" :disabled="busy" @click="change(m.id,'reject')">Reject</button><button class="text-sm text-red-700" :disabled="busy" @click="change(m.id,'delete')">Delete</button><a v-if="m.url" :href="m.url" target="_blank" rel="noopener" class="text-sm text-[#90612E]">Open</a></div>
   </article>
  </div>
 </main>
</template>
