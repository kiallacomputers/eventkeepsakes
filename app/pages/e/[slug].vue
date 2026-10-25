<script setup lang="ts">
const route=useRoute()
const client=useSupabaseClient()
const dialog=useAppDialog()
const slug=String(route.params.slug)
const item=ref<any>(null)
const loading=ref(true),busy=ref(false),error=ref(''),notice=ref(''),pin=ref(''),unlocked=ref(false)
const guestName=ref(''),media=ref<any[]>([]),galleryError=ref('')
type UploadState = { key:string; file:File; preview:string|null; state:'ready'|'uploading'|'uploaded'|'failed'; error:string }
const uploads=ref<UploadState[]>([])
const dragging=ref(false)
const dragDepth=ref(0)
const uploadDone=computed(()=>uploads.value.filter(x=>x.state==='uploaded').length)
const uploadFailed=computed(()=>uploads.value.filter(x=>x.state==='failed').length)
const uploadPercent=computed(()=>uploads.value.length?Math.round(uploadDone.value/uploads.value.length*100):0)
const sizeLabel=(bytes:number)=>bytes>=1048576?`${(bytes/1048576).toFixed(1)} MB`:`${Math.round(bytes/1024)} KB`
function cleanupPreviews(){for(const x of uploads.value)if(x.preview)URL.revokeObjectURL(x.preview)}
function removeFile(key:string){const idx=uploads.value.findIndex(x=>x.key===key);if(idx<0||busy.value)return;const x=uploads.value[idx];if(x.preview)URL.revokeObjectURL(x.preview);uploads.value.splice(idx,1)}
function friendlyUploadError(e:any){const message=String(e?.data?.statusMessage||e?.message||'Upload failed');if(/storage limit/i.test(message))return 'This event has reached its storage limit. Please contact the event organiser.';if(/unsupported file type or file size/i.test(message))return 'This file type or size is not supported. Photos must be 20 MB or less and videos 100 MB or less.';return message}

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
const allowedTypes = new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm'])
function addFiles(files:File[]){
 if(busy.value||!canUpload.value)return
 const accepted=files.filter(f=>allowedTypes.has(f.type))
 const rejected=files.length-accepted.length
 for(const file of accepted){
  const key=`${file.name}:${file.size}:${file.lastModified}:${Math.random()}`
  uploads.value.push({key,file,preview:file.type.startsWith('image/')?URL.createObjectURL(file):null,state:'ready',error:''})
 }
 if(rejected)error.value=`${rejected} file(s) were not added because their file type is unsupported.`
 else error.value=''
}
function selected(e:Event){
 const input=e.target as HTMLInputElement
 addFiles(Array.from(input.files||[]))
 input.value=''
}
function dragEnter(e:DragEvent){
 e.preventDefault()
 if(busy.value||!canUpload.value)return
 dragDepth.value++
 dragging.value=true
}
function dragOver(e:DragEvent){
 e.preventDefault()
 if(e.dataTransfer)e.dataTransfer.dropEffect=busy.value?'none':'copy'
}
function dragLeave(e:DragEvent){
 e.preventDefault()
 dragDepth.value=Math.max(0,dragDepth.value-1)
 if(dragDepth.value===0)dragging.value=false
}
function dropFiles(e:DragEvent){
 e.preventDefault()
 dragging.value=false
 dragDepth.value=0
 if(busy.value||!canUpload.value)return
 addFiles(Array.from(e.dataTransfer?.files||[]))
}
async function uploadOne(x:UploadState){
 x.state='uploading';x.error=''
 try{
  const file=x.file
  const {id,path,token}=await $fetch<{id:string,path:string,token:string}>('/api/guest/intent',{method:'POST',body:{slug,filename:file.name,mime:file.type,size:file.size,name:guestName.value}})
  const {error:uploadError}=await client.storage.from('event-media').uploadToSignedUrl(path,token,file,{contentType:file.type,upsert:false})
  if(uploadError)throw uploadError
  await $fetch('/api/guest/finalize',{method:'POST',body:{slug,id}})
  x.state='uploaded'
 }catch(e:any){x.state='failed';x.error=friendlyUploadError(e)}
}
async function upload(){
 if(busy.value||!uploads.value.some(x=>x.state==='ready'||x.state==='failed'))return
 busy.value=true;error.value='';notice.value=''
 // Sequential uploads deliberately preserve existing server-side quota behaviour.
 try{
  for(const x of uploads.value){if(x.state==='ready'||x.state==='failed')await uploadOne(x)}
  const failures=uploads.value.filter(x=>x.state==='failed')
  if(failures.length){error.value=`${uploadDone.value} uploaded; ${failures.length} could not be uploaded. You can retry the failed files.`}
  else if(uploadDone.value){notice.value=`${uploadDone.value} file(s) uploaded successfully.${item.value?.moderation_enabled?' Awaiting event holder approval.':''}`;dialog.show(notice.value,'success','Memories uploaded')}
  if(canBrowse.value)await loadGallery()
 }finally{busy.value=false}
}
function clearCompleted(){if(busy.value)return;for(const x of uploads.value.filter(x=>x.state==='uploaded'))if(x.preview)URL.revokeObjectURL(x.preview);uploads.value=uploads.value.filter(x=>x.state!=='uploaded')}
onMounted(()=>{timer=setInterval(()=>now.value=Date.now(),30000);window.addEventListener('keydown',galleryKeydown);load()})
onUnmounted(()=>{if(timer)clearInterval(timer);window.removeEventListener('keydown',galleryKeydown);cleanupPreviews()})
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
    <section class="panel space-y-5" aria-label="Guest memory uploads">
     <div class="space-y-2 text-center">
      <p class="text-xs font-semibold uppercase tracking-[.2em] text-[#987143]">Your memories matter</p>
      <h2 class="text-2xl font-semibold text-[#0C1D2D]">Share your favourite moments</h2>
      <p class="text-sm text-[#536273]">Add photos and videos from your phone or computer. No account needed.</p>
     </div>
     <p v-if="!canUpload" class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[#6F5433]">Uploads are currently closed. The organiser controls the upload window.</p>
     <form v-else class="space-y-4" @submit.prevent="upload">
      <label v-if="item.guest_name_mode!=='disabled'" class="block text-sm font-semibold" for="guest-name">Your name {{item.guest_name_mode==='required'?'(required)':'(optional)'}}
       <input id="guest-name" v-model="guestName" class="input mt-2" maxlength="120" :required="item.guest_name_mode==='required'" placeholder="Your name" />
      </label>
      <label for="guest-files" class="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition focus-within:ring-2 focus-within:ring-[#B18A50]" :class="dragging ? 'border-[#B18A50] bg-[#F0E2C8] ring-2 ring-[#B18A50]' : 'border-[#D6B077] bg-[#FFFDF8] hover:bg-[#F8F0E2]'" @dragenter.prevent="dragEnter" @dragover.prevent="dragOver" @dragleave.prevent="dragLeave" @drop.prevent="dropFiles">
       <span class="text-3xl" aria-hidden="true">📷</span>
       <span class="font-semibold text-[#0C1D2D]">{{ dragging ? 'Drop your photos & videos here' : 'Drag & drop photos and videos here' }}</span>
       <span class="text-xs text-[#536273]">or click to browse your device · Select multiple files</span>
       <input id="guest-files" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm" multiple class="sr-only" :disabled="busy" @change="selected" />
      </label>
      <p class="text-xs text-[#647080]">Photos up to 20 MB each · Videos up to 100 MB each · Uploads may require organiser approval.</p>
      <div v-if="uploads.length" class="space-y-3" aria-live="polite">
       <div class="flex flex-wrap items-center justify-between gap-2"><h3 class="font-semibold">Selected memories ({{uploads.length}})</h3><button v-if="uploadDone" type="button" class="text-sm font-medium text-[#90612E] underline" :disabled="busy" @click="clearCompleted">Clear completed</button></div>
       <div v-for="x in uploads" :key="x.key" class="flex items-center gap-3 rounded-lg border border-[#E4D8C5] bg-white p-3">
        <img v-if="x.preview" :src="x.preview" alt="Selected photo preview" class="h-14 w-14 shrink-0 rounded-md object-cover" />
        <div v-else class="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#F8F4EB] text-2xl" aria-hidden="true">🎬</div>
        <div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">{{x.file.name}}</p><p class="text-xs text-[#536273]">{{sizeLabel(x.file.size)}} · {{x.state==='ready'?'Ready to upload':x.state==='uploading'?'Uploading…':x.state==='uploaded'?'Uploaded successfully':'Upload failed'}}</p><p v-if="x.error" class="mt-1 text-xs text-red-700" role="alert">{{x.error}}</p></div>
        <button v-if="x.state==='ready'||x.state==='failed'" type="button" class="rounded-md border border-[#D6B077] px-2 py-1 text-sm" :disabled="busy" :aria-label="`Remove ${x.file.name}`" @click="removeFile(x.key)">Remove</button>
        <span v-else-if="x.state==='uploaded'" class="text-green-700" aria-label="Uploaded">✓</span>
       </div>
       <div class="space-y-1"><div class="flex justify-between text-xs text-[#536273]"><span>{{uploadDone}} of {{uploads.length}} completed</span><span>{{uploadPercent}}%</span></div><div class="h-2 overflow-hidden rounded-full bg-[#E4D8C5]" role="progressbar" :aria-valuenow="uploadDone" :aria-valuemax="uploads.length" aria-valuemin="0" aria-label="Files uploaded"><div class="h-full rounded-full bg-[#B18A50] transition-all" :style="{width:`${uploadPercent}%`}" /></div></div>
      </div>
      <button class="btn w-full" :disabled="busy||!uploads.some(x=>x.state==='ready'||x.state==='failed')">{{busy?'Uploading memories…':uploadFailed?'Retry failed uploads':'Upload memories'}}</button>
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
