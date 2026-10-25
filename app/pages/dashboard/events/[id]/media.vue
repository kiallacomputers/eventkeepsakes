<script setup lang="ts">
definePageMeta({middleware:'auth'})
const route=useRoute(),client=useSupabaseClient()
const dialog = useAppDialog()
const eventId=String(route.params.id)
const storage=ref<any>(null)
const downloading=ref(false)
const media=ref<any[]>([]),busy=ref(false),error=ref(''),notice=ref('')
const galleryFilter=ref<'all'|'image'|'video'>('all')
const visibleMedia=computed(()=>media.value.filter(m=>galleryFilter.value==='all'||m.media_type===galleryFilter.value))
const touchStartX=ref<number|null>(null)
function onViewerTouchStart(e:TouchEvent){touchStartX.value=e.changedTouches[0]?.clientX??null}
function onViewerTouchEnd(e:TouchEvent){
 if(touchStartX.value===null)return
 const delta=(e.changedTouches[0]?.clientX??touchStartX.value)-touchStartX.value
 touchStartX.value=null
 if(Math.abs(delta)>65)shiftMedia(delta<0?1:-1)
}
watch(galleryFilter,()=>{activeMedia.value=null})
const activeMedia=ref<number|null>(null)
const viewing=computed(()=>activeMedia.value===null?null:visibleMedia.value[activeMedia.value]||null)
function openMedia(index:number){activeMedia.value=index}
function closeMedia(){activeMedia.value=null}
function shiftMedia(delta:number){if(activeMedia.value!==null&&visibleMedia.value.length)activeMedia.value=(activeMedia.value+delta+visibleMedia.value.length)%visibleMedia.value.length}
function mediaKeydown(e:KeyboardEvent){if(activeMedia.value===null)return;if(e.key==='Escape')closeMedia();else if(e.key==='ArrowRight')shiftMedia(1);else if(e.key==='ArrowLeft')shiftMedia(-1)}
async function api<T>(path:string,options:any={}){
 const {data:{session}}=await client.auth.getSession()
 if(!session)throw new Error('Please sign in again')
 return $fetch<T>(path,{...options,headers:{...options.headers,authorization:`Bearer ${session.access_token}`}})
}
async function downloadZip(){
 if(downloading.value)return
 downloading.value=true;error.value=''
 try{
  const {data:{session}}=await client.auth.getSession()
  if(!session)throw new Error('Please sign in again')
  const response=await fetch('/api/owner/export',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${session.access_token}`},body:JSON.stringify({eventId})})
  if(!response.ok){const payload=await response.json().catch(()=>null);throw new Error(payload?.statusMessage||payload?.message||'Could not create ZIP download')}
  const blob=await response.blob()
  const url=URL.createObjectURL(blob)
  const link=document.createElement('a');link.href=url;link.download=`eventkeepsakes-${eventId}-originals.zip`;document.body.appendChild(link);link.click();link.remove()
  setTimeout(()=>URL.revokeObjectURL(url),60000)
  dialog.show('Original photos and videos downloaded without watermarks.','success')
 }catch(e:any){error.value=e?.message||'ZIP download failed'}finally{downloading.value=false}
}
async function load(){busy.value=true;error.value='';try{
 const data=await api<{media:any[]}>('/api/owner/media',{query:{id:eventId}})
 media.value=data.media
 storage.value=await api<any>('/api/owner/storage',{query:{id:eventId}})
}catch(e:any){error.value=e?.data?.statusMessage||e.message}finally{busy.value=false}}
async function change(mediaId:string,action:'approve'|'reject'|'delete'){
 if(action==='delete' && !(await dialog.confirm('This permanently deletes the selected photo or video. This cannot be undone.', 'Delete guest upload?', 'Delete permanently'))) return
 busy.value=true;error.value='';notice.value=''
 try{await api('/api/owner/media',{method:'POST',body:{eventId,mediaId,action}});notice.value='Media updated.';await load();dialog.show(action==='approve'?'Photo or video approved.':action==='reject'?'Photo or video rejected.':'Photo or video permanently deleted.','success')}
 catch(e:any){error.value=e?.data?.statusMessage||e.message}finally{busy.value=false}
}
onMounted(()=>{load();window.addEventListener('keydown',mediaKeydown)})
onUnmounted(()=>window.removeEventListener('keydown',mediaKeydown))
</script>
<template>
 <main class="mx-auto max-w-6xl px-5 py-10 space-y-6">
  <NuxtLink :to="`/dashboard/events/${eventId}`" class="ek-back-button inline-flex items-center gap-2 rounded-lg border border-[#D6B077] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold text-[#0C1D2D] shadow-sm transition hover:bg-[#F0E5D3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B18A50]"><span aria-hidden="true">←</span><span>Back</span></NuxtLink>
  <div class="flex flex-wrap items-center justify-between gap-4"><h1 class="text-3xl font-bold">Guest uploads</h1><button class="btn" :disabled="busy" @click="load">Refresh</button></div>
  <section class="panel space-y-3" aria-label="Event storage and downloads">
   <NuxtLink :to="`/dashboard/events/${eventId}/packages`" class="text-[#90612E] font-semibold">View or upgrade event package →</NuxtLink>
   <div class="flex flex-wrap items-center justify-between gap-4">
    <div><h2 class="text-xl font-semibold text-[#0C1D2D]">Storage &amp; Original Downloads</h2><p class="text-sm text-[#536273]">All downloads contain original files without preview watermarks.</p></div>
    <button class="btn" type="button" :disabled="downloading||busy||!storage?.files" @click="downloadZip">{{downloading?'Preparing ZIP…':'Download Complete Event ZIP'}}</button>
   </div>
   <template v-if="storage">
    <p class="text-sm text-[#0C1D2D]">{{(storage.usedBytes/1048576).toFixed(1)}} MB used of {{(storage.limitBytes/1048576).toFixed(0)}} MB · {{storage.files}} uploaded files</p>
    <div class="h-3 overflow-hidden rounded-full bg-[#E4D8C5]" role="progressbar" :aria-valuenow="Math.min(100,Math.round(storage.usedBytes/storage.limitBytes*100))" aria-valuemin="0" aria-valuemax="100" aria-label="Event storage used"><div class="h-full rounded-full bg-[#B18A50]" :style="{width:`${Math.min(100,storage.usedBytes/storage.limitBytes*100)}%`}" /></div>
    <p class="text-xs text-[#536273]">ZIP export currently supports up to {{storage.exportLimits.maxFiles}} files or {{(storage.exportLimits.maxBytes/1048576).toFixed(0)}} MB per download. Larger exports will be added later.</p>
   </template>
  </section>
  <p v-if="error" class="text-red-700" role="alert">{{error}}</p><p v-if="notice" class="text-green-800" role="status">{{notice}}</p>
  <p v-if="!media.length" class="panel">{{busy?'Loading uploads…':'No completed uploads yet.'}}</p>
  <div v-if="media.length" class="flex flex-wrap items-center justify-between gap-3">
   <p class="text-sm text-[#536273]">Showing {{visibleMedia.length}} of {{media.length}} files</p>
   <div class="flex flex-wrap gap-2" role="group" aria-label="Filter media">
    <button v-for="f in [{value:'all',label:'All'},{value:'image',label:'Photos'},{value:'video',label:'Videos'}]" :key="f.value" type="button" class="rounded-full border px-4 py-2 text-sm font-semibold" :class="galleryFilter===f.value?'border-[#0C1D2D] bg-[#0C1D2D] text-white':'border-[#D6B077] text-[#0C1D2D]'" :aria-pressed="galleryFilter===f.value" @click="galleryFilter=f.value as any">{{f.label}}</button>
   </div>
  </div>
  <p v-if="media.length&&!visibleMedia.length" class="panel">No files match this filter.</p>
  <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
   <article v-for="m in visibleMedia" :key="m.id" class="panel space-y-3">
    <button v-if="m.url" type="button" class="relative block w-full" :aria-label="`View ${m.media_type==='image'?'photo':'video'} in browser`" @click="openMedia(visibleMedia.indexOf(m))">
     <img v-if="m.media_type==='image'" :src="m.url" alt="Uploaded event photo" class="aspect-video w-full rounded-lg object-cover" />
     <video v-else :src="m.url" preload="metadata" muted playsinline class="pointer-events-none aspect-video w-full rounded-lg bg-black object-contain" />
     <span v-if="m.media_type!=='image'" class="absolute inset-0 flex items-center justify-center text-5xl text-white" aria-hidden="true">▶</span><MediaWatermark />
    </button>
    <p class="break-all text-sm font-semibold">{{m.original_name}}</p>
    <p class="text-xs text-[#536273]">{{m.contributor_name||'Anonymous'}} · {{(m.size_bytes/1048576).toFixed(1)}} MB · {{m.status}}</p>
    <div class="flex flex-wrap gap-2"><button v-if="m.status!=='approved'" class="btn text-sm" :disabled="busy" @click="change(m.id,'approve')">Approve</button><button v-if="m.status!=='rejected'" class="text-sm text-[#90612E]" :disabled="busy" @click="change(m.id,'reject')">Reject</button><button class="text-sm text-red-700" :disabled="busy" @click="change(m.id,'delete')">Delete</button><a v-if="m.url" :href="m.url" target="_blank" rel="noopener" class="text-sm text-[#90612E]">Open original</a></div>
   </article>
  </div>
  <Teleport to="body">
   <div v-if="viewing" class="fixed inset-0 z-[9000] flex items-center justify-center bg-[#081724]/95 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label="Event media viewer" @touchstart.passive="onViewerTouchStart" @touchend.passive="onViewerTouchEnd" @click.self="closeMedia">
    <div class="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-3">
     <div class="flex w-full items-center justify-between gap-3 text-white"><span class="text-sm">{{(activeMedia??0)+1}} of {{visibleMedia.length}}</span><button type="button" class="rounded-lg border border-white/40 px-4 py-2" @click="closeMedia">Close ×</button></div>
     <div v-if="viewing.media_type==='image'" class="relative min-h-0 max-h-[72vh] max-w-full overflow-hidden rounded-lg"><img :src="viewing.url" alt="Enlarged event photo" class="max-h-[72vh] max-w-full object-contain" /><MediaWatermark /></div>
     <div v-else class="relative min-h-0 max-h-[72vh] max-w-full overflow-hidden rounded-lg bg-black"><video :key="viewing.id" :src="viewing.url" controls autoplay playsinline preload="metadata" class="max-h-[72vh] max-w-full">Your browser cannot play this video format.</video><MediaWatermark /></div>
     <div class="flex w-full items-center justify-between gap-4 text-white"><button type="button" class="rounded-lg border border-white/40 px-4 py-2" @click="shiftMedia(-1)">← Previous</button><span class="text-center text-sm break-all">{{viewing.original_name}}</span><button type="button" class="rounded-lg border border-white/40 px-4 py-2" @click="shiftMedia(1)">Next →</button></div>
     <div v-if="visibleMedia.length>1" class="flex max-w-full gap-2 overflow-x-auto py-2" aria-label="Gallery thumbnails">
      <button v-for="(thumb,index) in visibleMedia" :key="thumb.id" type="button" class="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2" :class="activeMedia===index?'border-[#D6B077]':'border-transparent opacity-65'" :aria-label="`View item ${index+1}`" :aria-current="activeMedia===index?'true':undefined" @click="openMedia(index)">
       <img v-if="thumb.media_type==='image'" :src="thumb.url" alt="" class="h-full w-full object-cover" loading="lazy" />
       <span v-else class="flex h-full w-full items-center justify-center bg-[#25384B] text-white" aria-hidden="true">▶</span>
      </button>
     </div>
     <p class="text-center text-xs text-white/70">Swipe left or right on mobile · Use arrow keys on desktop · Esc to close</p>
     <a :href="viewing.url" target="_blank" rel="noopener" class="rounded-lg bg-[#D6B077] px-5 py-2 font-semibold text-[#0C1D2D]">Open original</a>
    </div>
   </div>
  </Teleport>
 </main>
</template>
