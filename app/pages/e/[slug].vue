<script setup lang="ts">
const route=useRoute()
const client=useSupabaseClient()
const dialog=useAppDialog()
const slug=String(route.params.slug)
const item=ref<any>(null)
const loading=ref(true),busy=ref(false),error=ref(''),notice=ref(''),pin=ref(''),unlocked=ref(false)
const guestName=ref(''),files=ref<File[]>([]),media=ref<any[]>([]),galleryError=ref('')
const now=ref(Date.now())
const activeMedia=ref<number|null>(null)
const viewing=computed(()=>activeMedia.value===null?null:media.value[activeMedia.value]||null)
function openMedia(index:number){activeMedia.value=index}
function closeMedia(){activeMedia.value=null}
function shiftMedia(delta:number){if(activeMedia.value!==null&&media.value.length)activeMedia.value=(activeMedia.value+delta+media.value.length)%media.value.length}
function galleryKeydown(e:KeyboardEvent){if(activeMedia.value===null)return;if(e.key==='Escape')closeMedia();else if(e.key==='ArrowRight')shiftMedia(1);else if(e.key==='ArrowLeft')shiftMedia(-1)}
let timer:ReturnType<typeof setInterval>|undefined
const canUpload=computed(()=>item.value?.status==='active'&&(!item.value.upload_starts_at||now.value>=Date.parse(item.value.upload_starts_at))&&(!item.value.upload_ends_at||now.value<=Date.parse(item.value.upload_ends_at)))
const canBrowse=computed(()=>item.value?.gallery_visibility==='shared'&&unlocked.value)
useHead({title:'Share memories · EventKeepsakes'})
async function load(){
 const {data,error:err}=await client.rpc('get_guest_event',{p_slug:slug})
 if(err) error.value=err.message
 else {item.value=data?.[0]||null;if(item.value&&!item.value.pin_enabled) unlocked.value=true}
 loading.value=false
 if(canBrowse.value) await loadGallery()
}
async function unlock(){busy.value=true;error.value='';try{
 await $fetch('/api/guest/access',{method:'POST',body:{slug,pin:pin.value}})
 unlocked.value=true;pin.value='';await loadGallery()
}catch(e:any){error.value=e?.data?.statusMessage||e.message||'Unable to unlock'}finally{busy.value=false}}
async function loadGallery(){galleryError.value='';try{
 const response=await $fetch<{media:any[]}>('/api/guest/gallery',{query:{slug}})
 media.value=response.media
}catch(e:any){galleryError.value=e?.data?.statusMessage||'Unable to load gallery'}}
function selected(e:Event){files.value=Array.from((e.target as HTMLInputElement).files||[])}
async function upload(){
 if(!files.value.length||busy.value)return
 busy.value=true;error.value='';notice.value=''
 let completed=0
 try{
  for(const file of files.value){
   const {id,path,token}=await $fetch<{id:string,path:string,token:string}>('/api/guest/intent',{method:'POST',body:{slug,filename:file.name,mime:file.type,size:file.size,name:guestName.value}})
   const {error:uploadError}=await client.storage.from('event-media').uploadToSignedUrl(path,token,file,{contentType:file.type,upsert:false})
   if(uploadError) throw uploadError
   await $fetch('/api/guest/finalize',{method:'POST',body:{slug,id}})
   completed++
  }
  notice.value=`${completed} file(s) uploaded successfully.${item.value?.moderation_enabled?' Awaiting event holder approval.':''}`
  dialog.show(notice.value, 'success', 'Memories uploaded')
  files.value=[]
  const picker=document.getElementById('guest-files') as HTMLInputElement|null
  if(picker)picker.value=''
  if(canBrowse.value)await loadGallery()
 }catch(e:any){error.value=`${completed} uploaded. ${e?.data?.statusMessage||e.message||'Upload failed'}`}
 finally{busy.value=false}
}
onMounted(()=>{timer=setInterval(()=>now.value=Date.now(),30000);window.addEventListener('keydown',galleryKeydown);load()})
onUnmounted(()=>{if(timer)clearInterval(timer);window.removeEventListener('keydown',galleryKeydown)})
</script>
<template>
 <main class="mx-auto max-w-4xl px-5 py-12 space-y-7">
  <div v-if="loading" class="text-[#536273]">Loading event…</div>
  <div v-else-if="item" class="space-y-7">
   <header class="text-center space-y-3"><p class="text-sm uppercase tracking-[.3em] text-[#987143]">Capture · Share · Remember</p><h1 class="text-4xl font-bold">{{ item.title }}</h1><p v-if="item.description" class="whitespace-pre-wrap text-[#455364]">{{ item.description }}</p></header>
   <p v-if="error" class="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800" role="alert">{{ error }}</p>
   <p v-if="notice" class="rounded-lg border border-amber-300 bg-amber-50 p-3" role="status">{{ notice }}</p>
   <form v-if="item.pin_enabled&&!unlocked" class="panel mx-auto max-w-md space-y-4" @submit.prevent="unlock">
    <h2 class="text-xl font-semibold">Private event access</h2><p>Enter the event PIN provided by the organiser.</p>
    <input v-model="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" class="input" placeholder="4–8 digit PIN" required />
    <button class="btn w-full" :disabled="busy">{{busy?'Checking…':'Enter event'}}</button>
   </form>
   <template v-else>
    <section class="panel space-y-4">
     <h2 class="text-2xl font-semibold">Share your memories</h2>
     <p v-if="!canUpload" class="text-[#6F5433]">Uploads are currently closed. The organiser controls the upload window.</p>
     <form v-else class="space-y-4" @submit.prevent="upload">
      <label v-if="item.guest_name_mode!=='disabled'" class="block text-sm font-semibold">Your name {{item.guest_name_mode==='required'?'(required)':'(optional)'}}<input v-model="guestName" class="input mt-2" maxlength="120" :required="item.guest_name_mode==='required'" placeholder="Your name" /></label>
      <label class="block text-sm font-semibold" for="guest-files">Photos and videos</label>
      <input id="guest-files" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" multiple class="input" @change="selected" />
      <p class="text-xs text-[#647080]">Photos up to 20 MB each; videos up to 100 MB each. Initial event storage allowance: 500 MB. Uploads may require organiser approval.</p>
      <p v-if="files.length" class="text-sm">{{files.length}} file(s) selected</p>
      <button class="btn" :disabled="busy||!files.length">{{busy?'Uploading…':'Upload memories'}}</button>
     </form>
    </section>
    <section v-if="item.gallery_visibility==='shared'" class="panel space-y-4">
     <div class="flex items-center justify-between gap-3"><h2 class="text-2xl font-semibold">Shared gallery</h2><button type="button" class="text-[#90612E]" @click="loadGallery">Refresh</button></div>
     <p v-if="galleryError" class="text-red-700">{{galleryError}}</p>
     <p v-else-if="!media.length" class="text-[#536273]">No approved photos or videos yet.</p>
     <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3">
      <div v-for="m in media" :key="m.id" class="space-y-2">
       <button v-if="m.media_type==='image'" type="button" class="relative block w-full overflow-hidden rounded-lg" :aria-label="`View guest photo ${media.indexOf(m)+1}`" @click="openMedia(media.indexOf(m))"><img :src="m.url" alt="Guest event photo" class="aspect-square w-full rounded-lg object-cover" loading="lazy" /><MediaWatermark /></button>
       <button v-else type="button" class="relative block w-full" :aria-label="`View guest video ${media.indexOf(m)+1}`" @click="openMedia(media.indexOf(m))"><video :src="m.url" preload="metadata" muted playsinline class="aspect-square w-full rounded-lg bg-black object-contain pointer-events-none" /><span class="absolute inset-0 flex items-center justify-center text-5xl text-white" aria-hidden="true">▶</span><MediaWatermark /></button>
       <p v-if="m.name" class="text-xs text-[#536273]">{{m.name}}</p>
       <a v-if="m.download" :href="m.url" target="_blank" rel="noopener" class="text-sm text-[#90612E]">Open / save</a>
      </div>
     </div>
    </section>
    <section v-else class="panel"><h2 class="text-xl font-semibold">Private gallery</h2><p class="mt-2 text-[#536273]">Only the event organiser can view uploaded media.</p></section>
   </template>
  </div>
  <p v-else class="text-red-700">{{error||'Event not found'}}</p>
  <Teleport to="body">
   <div v-if="viewing" class="fixed inset-0 z-[9000] flex items-center justify-center bg-[#081724]/95 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label="Guest media viewer" @click.self="closeMedia">
    <div class="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-3">
     <div class="flex w-full items-center justify-between gap-3 text-white"><span class="text-sm">{{(activeMedia??0)+1}} of {{media.length}}</span><button type="button" class="rounded-lg border border-white/40 px-4 py-2" @click="closeMedia">Close ×</button></div>
     <div v-if="viewing.media_type==='image'" class="relative min-h-0 max-h-[72vh] max-w-full overflow-hidden rounded-lg"><img :src="viewing.url" alt="Enlarged guest event photo" class="max-h-[72vh] max-w-full object-contain" /><MediaWatermark /></div>
     <div v-else class="relative min-h-0 max-h-[72vh] max-w-full overflow-hidden rounded-lg bg-black"><video :key="viewing.id" :src="viewing.url" controls autoplay playsinline preload="metadata" class="max-h-[72vh] max-w-full">Your browser cannot play this video format.</video><MediaWatermark /></div>
     <div class="flex w-full items-center justify-between gap-4 text-white"><button type="button" class="rounded-lg border border-white/40 px-4 py-2" @click="shiftMedia(-1)">← Previous</button><span class="text-center text-sm">{{viewing.name||'Shared memory'}}</span><button type="button" class="rounded-lg border border-white/40 px-4 py-2" @click="shiftMedia(1)">Next →</button></div>
     <a v-if="viewing.download" :href="viewing.url" target="_blank" rel="noopener" class="rounded-lg bg-[#D6B077] px-5 py-2 font-semibold text-[#0C1D2D]">Open / save original</a>
    </div>
   </div>
  </Teleport>
 </main>
</template>
