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
const showThankYou=ref(false)
const completedThisBatch=ref(0)
const uploadIntroTitle=computed(()=>brand.value.guest_intro_title||'Share your favourite moments')
const uploadInstructions=computed(()=>brand.value.guest_upload_instructions||'Add photos and videos from your phone or computer. No account needed.')
const thankYouTitle=computed(()=>brand.value.guest_thank_you_title||'Thank you for sharing!')
const thankYouMessage=computed(()=>brand.value.guest_thank_you_message||'Your memories have been received. Thank you for celebrating with us!')
function uploadMore(){clearCompleted();showThankYou.value=false;notice.value=''}
function viewMemories(){showThankYou.value=false;nextTick(()=>document.getElementById('guest-gallery')?.scrollIntoView({behavior:'smooth',block:'start'}))}
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
const galleryFilter=ref<'all'|'image'|'video'>('all')
const galleryChosen=ref<string[]>([])
const galleryDownloading=ref(false)
const galleryDownloadError=ref('')
const galleryShareNotice=ref('')
function toggleGalleryChosen(id:string){galleryChosen.value=galleryChosen.value.includes(id)?galleryChosen.value.filter(x=>x!==id):[...galleryChosen.value,id]}
function chooseVisible(){galleryChosen.value=[...new Set([...galleryChosen.value,...visibleMedia.value.map(x=>x.id)])]}
async function downloadChosen(){
 if(galleryDownloading.value||!galleryChosen.value.length)return
 galleryDownloading.value=true;galleryDownloadError.value=''
 try{
  const response=await fetch('/api/guest/export',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',
   body:JSON.stringify({slug,mediaIds:galleryChosen.value})})
  if(!response.ok){const err=await response.json().catch(()=>null);throw new Error(err?.statusMessage||err?.message||'Download failed')}
  const blob=await response.blob(),url=URL.createObjectURL(blob),a=document.createElement('a')
  a.href=url;a.download='eventkeepsakes-selected-memories.zip';document.body.appendChild(a);a.click();a.remove()
  setTimeout(()=>URL.revokeObjectURL(url),60000)
 }catch(e:any){galleryDownloadError.value=e?.message||'Could not download selected memories'}
 finally{galleryDownloading.value=false}
}
async function shareMemory(id:string){
 const url=new URL(window.location.href);url.searchParams.set('memory',id)
 try{
  if(navigator.share)await navigator.share({title:item.value?.title||'EventKeepsakes memory',url:url.toString()})
  else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url.toString());galleryShareNotice.value='Gallery link copied'}
  else{galleryShareNotice.value='Copy this gallery link: '+url.toString()}
 }catch(e:any){if(e?.name!=='AbortError')galleryShareNotice.value='Could not share link'}
}
function openLinkedMemory(){
 const id=String(route.query.memory||'')
 const index=media.value.findIndex(m=>m.id===id)
 if(index>=0){galleryFilter.value='all';activeMedia.value=index}
}

const heroPalettes:Record<string,{text:string;accent:string}>={
 'classic-ivory':{text:'#FFF8EC',accent:'#E6CAA2'},'midnight-gold':{text:'#FFFFFF',accent:'#F2CF86'},'romantic-blush':{text:'#FFF3F4',accent:'#F7BBCB'},'elegant-charcoal':{text:'#2B2927',accent:'#7B5030'},'botanical-sage':{text:'#F7F6E9',accent:'#D6E6C1'},'modern-white':{text:'#FFFFFF',accent:'#FFFFFF'}}
function heroDesign(b:any){
 const pal=heroPalettes[b.hero_palette]||heroPalettes['midnight-gold'],opacity=Math.max(0,Math.min(90,Number(b.hero_overlay??65)))/100
 const dark=b.hero_text_color==='dark'||b.hero_palette==='elegant-charcoal',base=dark?'255,255,255':'5,14,24'
 const styles:Record<string,string>={
 'soft-gradient':`linear-gradient(to top,rgba(${base},${opacity}),transparent 95%)`,
 'romantic-glow':`radial-gradient(ellipse at center,rgba(229,158,177,${opacity*.3}),transparent 85%),linear-gradient(to top,rgba(63,28,49,${opacity}),transparent)`,
 'cinematic-dark':`radial-gradient(ellipse at center,transparent 5%,rgba(0,0,0,${opacity})),linear-gradient(to top,rgba(0,0,0,${opacity}),transparent)`,
 'clean-natural':`linear-gradient(to top,rgba(${base},${opacity*.3}),transparent)`,
 'frosted-glass':`linear-gradient(to top,rgba(${base},${opacity*.65}),rgba(${base},${opacity*.1}))`,
 'vintage-sepia':`linear-gradient(to top,rgba(85,51,25,${opacity}),rgba(130,100,62,${opacity*.2}))`,
 'full-colour-tint':`linear-gradient(to top,rgba(38,57,92,${opacity}),rgba(38,57,92,${opacity*.25}))`}
 return {text:dark?'#2B2927':pal.text,accent:pal.accent,overlay:styles[b.hero_effect]||styles['soft-gradient'],shadow:dark?'0 1px 8px rgba(255,255,255,.7)':'0 2px 12px rgba(0,0,0,.65)'}
}
function heroDecoration(b:any){return ({hearts:'──── ♡ ────',lines:'──────────',floral:'✦ ❀ ✦'} as Record<string,string>)[b.hero_decoration]||''}

const brand=ref<any>({welcome_message:'',gallery_layout:'grid',gallery_theme:'classic',gallery_accent:'#B18A50',cover_url:null})
const brandAccent=computed(()=>brand.value.gallery_theme==='custom'?brand.value.gallery_accent:({classic:'#B18A50',wedding:'#B58A98',birthday:'#8C67B1',corporate:'#376A86'} as Record<string,string>)[brand.value.gallery_theme]||'#B18A50')
async function loadBrand(){if(!unlocked.value)return;try{brand.value=await $fetch('/api/guest/branding',{query:{slug}})}catch{/* optional appearance */}}
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
 if(unlocked.value)await loadBrand()
 if(canBrowse.value) await loadGallery()
}
async function unlock(){busy.value=true;error.value='';try{
 await $fetch('/api/guest/access',{method:'POST',body:{slug,pin:pin.value}})
 unlocked.value=true;pin.value='';await loadBrand();await loadGallery()
}catch(e:any){error.value=e?.data?.statusMessage||e.message||'Unable to unlock'}finally{busy.value=false}}
async function loadGallery(){galleryError.value='';try{
 const response=await $fetch<{media:any[]}>('/api/guest/gallery',{query:{slug}})
 media.value=response.media
 galleryChosen.value=galleryChosen.value.filter(id=>response.media.some(m=>m.id===id))
 openLinkedMemory()
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
 busy.value=true;error.value='';notice.value='';showThankYou.value=false
 const previouslyUploaded=uploadDone.value
 // Sequential uploads deliberately preserve existing server-side quota behaviour.
 try{
  for(const x of uploads.value){if(x.state==='ready'||x.state==='failed')await uploadOne(x)}
  const failures=uploads.value.filter(x=>x.state==='failed')
  if(failures.length){error.value=`${uploadDone.value} uploaded; ${failures.length} could not be uploaded. You can retry the failed files.`}
  else if(uploadDone.value>previouslyUploaded){completedThisBatch.value=uploadDone.value-previouslyUploaded;showThankYou.value=true;notice.value=''}
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
   <header v-if="unlocked && brand.cover_url" class="relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden rounded-2xl sm:min-h-[440px]" :class="brand.hero_alignment==='left'?'items-start text-left':brand.hero_alignment==='right'?'items-end text-right':'items-center text-center'">
    <img :src="brand.cover_url" alt="Event cover photo" class="absolute inset-0 -z-20 h-full w-full object-cover" />
    <div class="absolute inset-0 -z-10" :style="{background:heroDesign(brand).overlay}" aria-hidden="true"></div>
    <div class="relative w-full max-w-3xl space-y-3 px-5 pb-8 pt-24 sm:px-10 sm:pb-12" :style="{textAlign:brand.hero_alignment||'center',marginLeft:brand.hero_alignment==='right'?'auto':undefined,marginRight:brand.hero_alignment==='left'?'auto':undefined,color:heroDesign(brand).text,textShadow:heroDesign(brand).shadow}">
     <p class="text-xs font-semibold uppercase tracking-[.28em] sm:text-sm" :style="{color:heroDesign(brand).accent}">Capture · Share · Remember</p><p v-if="heroDecoration(brand)" class="text-xl sm:text-2xl" :style="{color:heroDesign(brand).accent}">{{heroDecoration(brand)}}</p>
     <h1 class="text-3xl font-bold leading-tight drop-shadow-sm sm:text-5xl">{{item.title}}</h1>
     <p v-if="brand.welcome_message" class="whitespace-pre-wrap text-sm leading-relaxed sm:text-lg">{{brand.welcome_message}}</p>
     <p v-if="item.description" class="whitespace-pre-wrap text-sm leading-relaxed sm:text-base">{{item.description}}</p>
    </div>
   </header>
   <header v-else class="space-y-3 text-center"><p class="text-sm uppercase tracking-[.3em] text-[#987143]">Capture · Share · Remember</p><h1 class="text-4xl font-bold">{{item.title}}</h1><p v-if="unlocked && brand.welcome_message" class="mx-auto max-w-2xl whitespace-pre-wrap text-[#455364]">{{brand.welcome_message}}</p><p v-if="item.description" class="whitespace-pre-wrap text-[#455364]">{{item.description}}</p></header>
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
      <h2 class="text-2xl font-semibold text-[#0C1D2D]">{{uploadIntroTitle}}</h2>
      <p class="text-sm text-[#536273]">{{uploadInstructions}}</p>
     </div>
     <div v-if="showThankYou" class="rounded-2xl border border-[#D6B077] bg-[#FFFDF8] px-5 py-8 text-center" role="status" aria-live="polite">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-3xl text-emerald-700" aria-hidden="true">✓</div>
      <p class="mt-4 text-xs font-semibold uppercase tracking-widest" :style="{color:brandAccent}">Upload complete · {{completedThisBatch}} {{completedThisBatch===1?'memory':'memories'}}</p>
      <h3 class="mt-2 text-2xl font-bold">{{thankYouTitle}}</h3>
      <p class="mx-auto mt-3 max-w-xl whitespace-pre-wrap text-sm text-[#536273]">{{thankYouMessage}}</p>
      <p v-if="item.moderation_enabled" class="mt-3 text-sm text-[#536273]">Your uploads will appear in the gallery after the organiser approves them.</p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
       <button v-if="canUpload" type="button" class="btn" @click="uploadMore">Upload more memories</button>
       <button v-if="item.gallery_visibility==='shared'" type="button" class="rounded-lg border border-[#D6B077] px-4 py-2 text-sm font-semibold" @click="viewMemories">View gallery</button>
      </div>
     </div>
     <p v-if="!canUpload" class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[#6F5433]">Uploads are currently closed. The organiser controls the upload window.</p>
     <form v-else-if="!showThankYou" class="space-y-4" @submit.prevent="upload">
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
    <section id="guest-gallery" v-if="item.gallery_visibility==='shared'" class="panel space-y-4 scroll-mt-6">
     <div class="flex items-center justify-between gap-3"><h2 class="text-2xl font-semibold" :style="{color:brandAccent}">Shared gallery</h2><button type="button" class="text-[#90612E]" @click="loadGallery">Refresh</button></div>
     <p v-if="galleryError" class="text-red-700">{{galleryError}}</p>
     <p v-else-if="!media.length" class="text-[#536273]">No approved photos or videos yet.</p>
     <div v-if="media.length" class="flex flex-wrap gap-2" role="group" aria-label="Filter gallery">
      <button v-for="f in [{value:'all',label:'All memories'},{value:'image',label:'Photos'},{value:'video',label:'Videos'}]" :key="f.value" type="button" class="rounded-full border px-4 py-2 text-sm font-semibold" :class="galleryFilter===f.value?'border-[#0C1D2D] bg-[#0C1D2D] text-white':'border-[#D6B077] text-[#0C1D2D]'" :aria-pressed="galleryFilter===f.value" @click="galleryFilter=f.value as any">{{f.label}}</button>
     </div>
     <div v-if="media.length && media.some(m=>m.download)" class="flex flex-wrap items-center gap-3 rounded-lg border border-[#D6B077] p-3">
      <span class="text-sm font-semibold">{{galleryChosen.length}} selected</span>
      <button type="button" class="text-sm text-[#90612E] underline" @click="chooseVisible">Select visible</button>
      <button type="button" class="text-sm text-[#90612E] underline" @click="galleryChosen=[]">Clear selection</button>
      <button type="button" class="btn text-sm" :disabled="!galleryChosen.length||galleryDownloading" @click="downloadChosen">{{galleryDownloading?'Preparing ZIP…':'Download selected ZIP'}}</button>
     </div>
     <p v-if="galleryDownloadError" role="alert" class="text-sm text-red-700">{{galleryDownloadError}}</p>
     <p v-if="galleryShareNotice" role="status" class="break-all text-sm text-[#536273]">{{galleryShareNotice}}</p>
     <p v-if="media.length&&!visibleMedia.length" class="text-sm text-[#536273]">No memories match this filter.</p>
     <div v-if="visibleMedia.length" :class="brand.gallery_layout==='masonry'?'columns-2 md:columns-3 gap-3 space-y-3':'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3'">
      <div v-for="m in visibleMedia" :key="m.id" class="space-y-2 break-inside-avoid">
       <label v-if="m.download" class="flex items-center gap-2 text-sm"><input type="checkbox" :checked="galleryChosen.includes(m.id)" @change="toggleGalleryChosen(m.id)" /> Select</label>
       <button v-if="m.media_type==='image'" type="button" class="relative block w-full overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B18A50]" :aria-label="`View guest photo ${visibleMedia.indexOf(m)+1}`" @click="openMedia(visibleMedia.indexOf(m))"><img :src="m.url" alt="Guest event photo" class="aspect-square w-full rounded-lg object-cover" loading="lazy" /><MediaWatermark /></button>
       <button v-else type="button" class="relative block w-full" :aria-label="`View guest video ${visibleMedia.indexOf(m)+1}`" @click="openMedia(visibleMedia.indexOf(m))"><video :src="m.url" preload="metadata" muted playsinline class="aspect-square w-full rounded-lg bg-black object-contain pointer-events-none" /><span class="absolute inset-0 flex items-center justify-center text-5xl text-white" aria-hidden="true">▶</span><MediaWatermark /></button>
       <p v-if="m.name" class="text-xs text-[#536273]">{{m.name}}</p>
       <div class="flex flex-wrap gap-3">
        <a v-if="m.download" :href="m.url" target="_blank" rel="noopener" class="text-sm text-[#90612E]">Open / save</a>
        <button type="button" class="text-sm text-[#90612E] underline" @click="shareMemory(m.id)">Share gallery link</button>
       </div>
      </div>
     </div>
    </section>
    <section v-else class="panel"><h2 class="text-xl font-semibold">Private gallery</h2><p class="mt-2 text-[#536273]">Only the event organiser can view uploaded media.</p></section>
   </template>
  </div>
  <p v-else class="text-red-700">{{error||'Event not found'}}</p>
  <Teleport to="body">
   <div v-if="viewing" class="fixed inset-0 z-[9000] flex items-center justify-center bg-[#081724]/95 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label="Guest media viewer" @touchstart.passive="onViewerTouchStart" @touchend.passive="onViewerTouchEnd" @click.self="closeMedia">
    <div class="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-3">
     <div class="flex w-full items-center justify-between gap-3 text-white"><span class="text-sm">{{(activeMedia??0)+1}} of {{visibleMedia.length}}</span><button type="button" class="rounded-lg border border-white/40 px-4 py-2" @click="closeMedia">Close ×</button></div>
     <div v-if="viewing.media_type==='image'" class="relative min-h-0 max-h-[72vh] max-w-full overflow-hidden rounded-lg"><img :src="viewing.url" alt="Enlarged guest event photo" class="max-h-[72vh] max-w-full object-contain" /><MediaWatermark /></div>
     <div v-else class="relative min-h-0 max-h-[72vh] max-w-full overflow-hidden rounded-lg bg-black"><video :key="viewing.id" :src="viewing.url" controls autoplay playsinline preload="metadata" class="max-h-[72vh] max-w-full">Your browser cannot play this video format.</video><MediaWatermark /></div>
     <div class="flex w-full items-center justify-between gap-4 text-white"><button type="button" class="rounded-lg border border-white/40 px-4 py-2" @click="shiftMedia(-1)">← Previous</button><span class="text-center text-sm">{{viewing.name||'Shared memory'}}</span><button type="button" class="rounded-lg border border-white/40 px-4 py-2" @click="shiftMedia(1)">Next →</button></div>
     <div v-if="visibleMedia.length>1" class="flex max-w-full gap-2 overflow-x-auto py-2" aria-label="Gallery thumbnails">
      <button v-for="(thumb,index) in visibleMedia" :key="thumb.id" type="button" class="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2" :class="activeMedia===index?'border-[#D6B077]':'border-transparent opacity-65'" :aria-label="`View item ${index+1}`" :aria-current="activeMedia===index?'true':undefined" @click="openMedia(index)">
       <img v-if="thumb.media_type==='image'" :src="thumb.url" alt="" class="h-full w-full object-cover" loading="lazy" />
       <span v-else class="flex h-full w-full items-center justify-center bg-[#25384B] text-white" aria-hidden="true">▶</span>
      </button>
     </div>
     <p class="text-center text-xs text-white/70">Swipe left or right on mobile · Use arrow keys on desktop · Esc to close</p>
     <a v-if="viewing.download" :href="viewing.url" target="_blank" rel="noopener" class="rounded-lg bg-[#D6B077] px-5 py-2 font-semibold text-[#0C1D2D]">Open / save original</a>
    </div>
   </div>
  </Teleport>
 </main>
</template>
