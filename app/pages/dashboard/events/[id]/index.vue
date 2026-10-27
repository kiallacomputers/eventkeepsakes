<script setup lang="ts">
import QRCode from 'qrcode'
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const client = useSupabaseClient()
const dialog = useAppDialog()
const event = ref<any>(null)
const error = ref('')
const notice = ref('')
const saving = ref(false)
const loading = ref(true)
const pin = ref('')
const pinSaving = ref(false)
const qrDataUrl = ref('')
const overview = ref<any>(null)
const overviewError = ref('')
const overviewLoading = ref(false)
async function loadOverview() {
 overviewLoading.value=true;overviewError.value=''
 try {
  const {data:{session}}=await client.auth.getSession()
  if(!session)throw new Error('Please sign in again')
  overview.value=await $fetch('/api/owner/overview',{
   query:{id:String(route.params.id)},
   headers:{authorization:`Bearer ${session.access_token}`}
  })
 }catch(e:any){overviewError.value=e?.data?.statusMessage||e?.message||'Unable to load event overview'}
 finally{overviewLoading.value=false}
}
const reservedStorage = computed(()=>Number(storage.value?.reservedBytes||0))
const remainingStorage = computed(()=>Math.max(0,Number(storage.value?.availableBytes ?? storage.value?.remainingBytes ?? 0)))
const eventDateLabel = computed(()=>event.value?.event_date
 ? new Date(`${event.value.event_date}T12:00:00`).toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})
 : 'Date not set')
const uploadStatusLabel = computed(()=>overview.value?.uploadState==='open'?'Uploads open':overview.value?.uploadState==='scheduled'?'Opens soon':'Uploads closed')
const storage = ref<any>(null)
const storageError = ref('')
const storageLoading = ref(false)
const formatBytes = (n:number) => n >= 1073741824 ? `${(n/1073741824).toFixed(2)} GB` : `${(n/1048576).toFixed(1)} MB`
const usedPercent = computed(() => storage.value?.limitBytes ? Math.min(100, Math.round(storage.value.usedBytes/storage.value.limitBytes*100)) : 0)
async function loadStorage() {
 storageLoading.value=true;storageError.value=''
 try {
  const {data:{session}}=await client.auth.getSession()
  if(!session) throw new Error('Please sign in again')
  storage.value=await $fetch('/api/owner/storage',{query:{id:String(route.params.id)},headers:{authorization:`Bearer ${session.access_token}`}})
 } catch(e:any) { storageError.value=e?.data?.statusMessage||e?.message||'Unable to load storage' }
 finally {storageLoading.value=false}
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

// Coordinated event design presets; values are validated by the existing branding API.
const eventThemePresets=[
 {id:'wedding',label:'Wedding',subtitle:'Blush, soft light & romantic details',gallery_theme:'wedding',gallery_accent:'#B58A98',hero_palette:'romantic-blush',hero_effect:'romantic-glow',hero_decoration:'hearts',hero_alignment:'center',hero_overlay:65,hero_text_color:'light',gallery_layout:'masonry'},
 {id:'birthday',label:'Birthday',subtitle:'Playful purple & bright celebrations',gallery_theme:'birthday',gallery_accent:'#8C67B1',hero_palette:'modern-white',hero_effect:'full-colour-tint',hero_decoration:'floral',hero_alignment:'center',hero_overlay:60,hero_text_color:'light',gallery_layout:'grid'},
 {id:'corporate',label:'Corporate',subtitle:'Midnight blue & crisp typography',gallery_theme:'corporate',gallery_accent:'#376A86',hero_palette:'midnight-gold',hero_effect:'cinematic-dark',hero_decoration:'lines',hero_alignment:'left',hero_overlay:70,hero_text_color:'light',gallery_layout:'grid'},
 {id:'anniversary',label:'Anniversary',subtitle:'Timeless ivory & golden warmth',gallery_theme:'custom',gallery_accent:'#BA9262',hero_palette:'classic-ivory',hero_effect:'vintage-sepia',hero_decoration:'hearts',hero_alignment:'center',hero_overlay:60,hero_text_color:'light',gallery_layout:'masonry'},
 {id:'baby-shower',label:'Baby Shower',subtitle:'Gentle pastels & airy light',gallery_theme:'custom',gallery_accent:'#B58BA6',hero_palette:'romantic-blush',hero_effect:'clean-natural',hero_decoration:'floral',hero_alignment:'center',hero_overlay:50,hero_text_color:'light',gallery_layout:'grid'},
 {id:'graduation',label:'Graduation',subtitle:'Confident gold & deep contrast',gallery_theme:'custom',gallery_accent:'#B68A3F',hero_palette:'midnight-gold',hero_effect:'cinematic-dark',hero_decoration:'lines',hero_alignment:'center',hero_overlay:70,hero_text_color:'light',gallery_layout:'grid'},
 {id:'memorial',label:'Celebration of Life',subtitle:'Understated sage & soft tones',gallery_theme:'custom',gallery_accent:'#839987',hero_palette:'botanical-sage',hero_effect:'soft-gradient',hero_decoration:'none',hero_alignment:'center',hero_overlay:55,hero_text_color:'light',gallery_layout:'masonry'},
 {id:'party',label:'Party & Festival',subtitle:'Bold colours & vibrant atmosphere',gallery_theme:'custom',gallery_accent:'#8B57BC',hero_palette:'modern-white',hero_effect:'full-colour-tint',hero_decoration:'floral',hero_alignment:'center',hero_overlay:65,hero_text_color:'light',gallery_layout:'grid'},
 {id:'classic',label:'Classic',subtitle:'Elegant neutral style for any event',gallery_theme:'classic',gallery_accent:'#B18A50',hero_palette:'classic-ivory',hero_effect:'soft-gradient',hero_decoration:'none',hero_alignment:'center',hero_overlay:65,hero_text_color:'light',gallery_layout:'grid'}
] as const
const chosenThemePreset=ref('')
function applyThemePreset(id:string){
 const preset=eventThemePresets.find(p=>p.id===id)
 if(!preset)return
 // Preserve the uploaded cover, welcome message and event-specific content.
 Object.assign(branding.value,{
  gallery_theme:preset.gallery_theme,gallery_accent:preset.gallery_accent,
  hero_palette:preset.hero_palette,hero_effect:preset.hero_effect,
  hero_decoration:preset.hero_decoration,hero_alignment:preset.hero_alignment,
  hero_overlay:preset.hero_overlay,hero_text_color:preset.hero_text_color,
  gallery_layout:preset.gallery_layout
 })
 chosenThemePreset.value=id
}

const branding=ref<any>({welcome_message:'',gallery_layout:'grid',gallery_theme:'classic',gallery_accent:'#B18A50',cover_url:null})
const countdownLocal=computed({
 get:()=>{const d=branding.value.countdown_target;if(!d)return '';const parsed=new Date(d);if(!Number.isFinite(parsed.getTime()))return '';const local=new Date(parsed.getTime()-parsed.getTimezoneOffset()*60000);return local.toISOString().slice(0,16)},
 set:(value:string)=>{branding.value.countdown_target=value?new Date(value).toISOString():null}
})
const countdownPreview=computed(()=>{const t=Date.parse(branding.value.countdown_target||'');return Number.isFinite(t)?new Date(t).toLocaleString(undefined,{dateStyle:'full',timeStyle:'short'}):'Choose a date and time'})
const coverBusy=ref(false),brandingBusy=ref(false),brandingError=ref('')
const themeAccent=computed(()=>branding.value.gallery_theme==='custom'?branding.value.gallery_accent:({classic:'#B18A50',wedding:'#B58A98',birthday:'#8C67B1',corporate:'#376A86'} as Record<string,string>)[branding.value.gallery_theme]||'#B18A50')
async function brandAuth(){const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in again');return {authorization:`Bearer ${session.access_token}`}}
async function loadBranding(){try{branding.value=await $fetch('/api/owner/branding',{query:{id:String(route.params.id)},headers:await brandAuth()})}catch(e:any){brandingError.value=e?.data?.statusMessage||e.message}}
async function saveBranding(){brandingBusy.value=true;brandingError.value='';try{await $fetch('/api/owner/branding',{method:'PUT',body:{id:String(route.params.id),...branding.value},headers:await brandAuth()});dialog.show('Gallery branding saved.','success')}catch(e:any){brandingError.value=e?.data?.statusMessage||e.message}finally{brandingBusy.value=false}}
async function uploadCover(e:Event){const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;coverBusy.value=true;brandingError.value='';try{const form=new FormData();form.append('id',String(route.params.id));form.append('file',file);await $fetch('/api/owner/cover',{method:'POST',body:form,headers:await brandAuth()});await loadBranding();dialog.show('Cover photo uploaded.','success')}catch(e:any){brandingError.value=e?.data?.statusMessage||e.message}finally{coverBusy.value=false;(e.target as HTMLInputElement).value=''}}
async function removeCover(){coverBusy.value=true;brandingError.value='';try{await $fetch('/api/owner/cover',{method:'DELETE',query:{id:String(route.params.id)},headers:await brandAuth()});await loadBranding()}catch(e:any){brandingError.value=e?.data?.statusMessage||e.message}finally{coverBusy.value=false}}
const guestUrl = computed(() => event.value ? `${windowOrigin.value}/e/${encodeURIComponent(event.value.slug)}` : '')
const windowOrigin = ref('')
const statusOptions = ['draft','active','paused','closed']
const startsLocal = ref('')
const endsLocal = ref('')
function toLocal(iso: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0,16)
}
function toUtc(value: string) { return value ? new Date(value).toISOString() : null }
async function load() {
  loading.value = true
  error.value = ''
  const { data, error: err } = await client.from('events').select('id,title,slug,event_date,status,description,timezone,upload_starts_at,upload_ends_at,gallery_visibility,moderation_enabled,guest_downloads_enabled,guest_name_mode,show_contributor_names,pin_enabled').eq('id', String(route.params.id)).single()
  if (err) error.value = err.message
  else {
    event.value = data
    startsLocal.value = toLocal(data.upload_starts_at)
    endsLocal.value = toLocal(data.upload_ends_at)
    if (import.meta.client) qrDataUrl.value = await QRCode.toDataURL(guestUrl.value, { width: 600, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#15263B', light: '#FFFFFF' } })
  }
  loading.value = false
}
async function save() {
  if (!event.value || saving.value) return
  saving.value = true
  error.value = ''; notice.value = ''
  try {
    if (!event.value.title.trim()) throw new Error('Event name is required.')
    const start = toUtc(startsLocal.value)
    const end = toUtc(endsLocal.value)
    if (start && end && start >= end) throw new Error('Upload end must be after upload start.')
    const { error: err } = await client.from('events').update({
      title: event.value.title.trim(), description: event.value.description || '',
      event_date: event.value.event_date || null, status: event.value.status,
      timezone: event.value.timezone || 'Australia/Melbourne',
      upload_starts_at: start, upload_ends_at: end,
      gallery_visibility: event.value.gallery_visibility,
      moderation_enabled: event.value.moderation_enabled,
      guest_downloads_enabled: event.value.guest_downloads_enabled,
      guest_name_mode: event.value.guest_name_mode,
      show_contributor_names: event.value.show_contributor_names
    }).eq('id', event.value.id)
    if (err) throw err
    notice.value = 'Event settings saved.'
    dialog.show(notice.value, 'success')
  } catch (e: any) { error.value = e.message || 'Unable to save.' }
  finally { saving.value = false }
}
async function savePin() {
  if (!event.value || pinSaving.value) return
  pinSaving.value = true; error.value = ''; notice.value = ''
  try {
    if (pin.value && !/^\d{4,8}$/.test(pin.value)) throw new Error('PIN must be 4–8 digits.')
    const { error: err } = await client.rpc('set_event_pin', { p_event_id: event.value.id, p_pin: pin.value })
    if (err) throw err
    event.value.pin_enabled = !!pin.value
    pin.value = ''
    notice.value = event.value.pin_enabled ? 'PIN updated.' : 'PIN disabled.'
    dialog.show(notice.value, 'success')
  } catch (e: any) { error.value = e.message || 'Unable to update PIN.' }
  finally { pinSaving.value = false }
}
function downloadQr() {
  if (!qrDataUrl.value || !event.value) return
  const a = document.createElement('a'); a.href = qrDataUrl.value; a.download = `eventkeepsakes-${event.value.slug}-qr.png`; a.click()
}
async function copyLink() { try { await navigator.clipboard.writeText(guestUrl.value); notice.value = 'Guest link copied.'; dialog.show(notice.value, 'success') } catch { error.value = 'Unable to copy. Select the link manually.' } }
onMounted(() => { windowOrigin.value = window.location.origin; load(); loadStorage(); loadOverview(); loadBranding() })
</script>
<template>
  <div class="mx-auto max-w-5xl px-5 py-10 space-y-7">
    <NuxtLink to="/dashboard" class="ek-back-button inline-flex items-center gap-2 rounded-lg border border-[#D6B077] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold text-[#0C1D2D] shadow-sm transition hover:bg-[#F0E5D3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B18A50]"><span aria-hidden="true">←</span><span>Back</span></NuxtLink>
    <p v-if="loading" class="text-[#536273]">Loading event…</p>
    <div v-else-if="event" class="space-y-7">
      <div><h1 class="text-3xl font-bold">{{ event.title }}</h1><p class="text-[#536273] mt-2">Manage your event, sharing and access settings.</p></div>
      <p v-if="error" class="rounded-lg border border-red-500 p-3 text-red-700" role="alert">{{ error }}</p>
      <p v-if="notice" class="rounded-lg border border-teal-500 p-3 text-[#336A57]" role="status">{{ notice }}</p>
      <!-- Phase 9B: read-only owner overview. Existing event settings are preserved. -->
      <section class="space-y-4" aria-label="Event overview">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold text-[#0C1D2D]">Event overview</h2>
            <p class="text-sm text-[#536273]">{{ eventDateLabel }} · {{ event.status }}</p>
          </div>
          <button type="button" class="rounded-lg border border-[#D6B077] px-4 py-2 text-sm font-semibold text-[#0C1D2D] hover:bg-[#F0E5D3]" :disabled="overviewLoading || storageLoading" @click="loadOverview(); loadStorage()">
            {{ overviewLoading || storageLoading ? 'Refreshing…' : 'Refresh overview' }}
          </button>
        </div>
        <p v-if="overviewError" role="alert" class="rounded-lg border border-red-300 p-3 text-sm text-red-700">{{ overviewError }} <button type="button" class="underline" @click="loadOverview">Retry</button></p>
        <p v-if="overviewLoading && !overview" class="text-sm text-[#536273]">Loading event statistics…</p>
        <div v-if="overview" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div class="panel space-y-1"><p class="text-xs text-[#536273]">Photos</p><p class="text-3xl font-bold text-[#0C1D2D]">{{ overview.photos }}</p></div>
          <div class="panel space-y-1"><p class="text-xs text-[#536273]">Videos</p><p class="text-3xl font-bold text-[#0C1D2D]">{{ overview.videos }}</p></div>
          <div class="panel space-y-1"><p class="text-xs text-[#536273]">Awaiting review</p><p class="text-3xl font-bold text-[#0C1D2D]">{{ overview.pending }}</p></div>
          <div class="panel space-y-1"><p class="text-xs text-[#536273]">Approved</p><p class="text-3xl font-bold text-[#0C1D2D]">{{ overview.approved }}</p></div>
        </div>
        <div class="grid gap-3 md:grid-cols-2">
          <div class="panel space-y-2">
            <h3 class="font-semibold text-[#0C1D2D]">Guest uploads</h3>
            <p class="text-sm font-semibold" :class="overview?.uploadState==='open'?'text-[#336A57]':'text-[#90612E]'">{{ overview ? uploadStatusLabel : 'Checking…' }}</p>
            <p v-if="overview?.uploadStartsAt" class="text-xs text-[#536273]">Opens: {{ new Date(overview.uploadStartsAt).toLocaleString('en-AU') }}</p>
            <p v-if="overview?.uploadEndsAt" class="text-xs text-[#536273]">Closes: {{ new Date(overview.uploadEndsAt).toLocaleString('en-AU') }}</p>
            <p v-if="overview && !overview.uploadEndsAt" class="text-xs text-[#536273]">No closing date set</p>
          </div>
          <div class="panel space-y-2">
            <h3 class="font-semibold text-[#0C1D2D]">Storage at a glance</h3>
            <p v-if="storageError" class="text-sm text-red-700">{{ storageError }}</p>
            <template v-else-if="storage">
              <p class="text-sm text-[#536273]">{{ formatBytes(storage.usedBytes) }} used of {{ formatBytes(storage.limitBytes) }}</p>
              <div class="h-2 overflow-hidden rounded-full bg-[#E4D8C5]"><div class="h-full bg-[#B18A50]" :style="{width:`${usedPercent}%`}" /></div>
              <p class="text-xs text-[#536273]">{{ formatBytes(remainingStorage) }} available<span v-if="reservedStorage"> · {{ formatBytes(reservedStorage) }} reserved for uploads</span></p>
              <p v-if="storage.expiresAt" class="text-xs text-[#536273]">Storage expiry: {{ new Date(storage.expiresAt).toLocaleDateString('en-AU') }}</p>
            </template>
            <p v-else class="text-sm text-[#536273]">Loading storage…</p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <NuxtLink :to="`/dashboard/events/${event.id}/media`" class="rounded-xl border border-[#D6B077] bg-[#FFFDF8] px-3 py-4 text-center text-sm font-semibold text-[#0C1D2D] hover:bg-[#F0E5D3]">Manage media →</NuxtLink>
          <NuxtLink :to="`/dashboard/events/${event.id}/sign`" class="rounded-xl border border-[#D6B077] bg-[#FFFDF8] px-3 py-4 text-center text-sm font-semibold text-[#0C1D2D] hover:bg-[#F0E5D3]">QR signs →</NuxtLink>
          <NuxtLink :to="`/dashboard/events/${event.id}/packages`" class="rounded-xl border border-[#D6B077] bg-[#FFFDF8] px-3 py-4 text-center text-sm font-semibold text-[#0C1D2D] hover:bg-[#F0E5D3]">Package &amp; storage →</NuxtLink>
          <a v-if="guestUrl" :href="guestUrl" target="_blank" rel="noopener noreferrer" class="rounded-xl border border-[#D6B077] bg-[#FFFDF8] px-3 py-4 text-center text-sm font-semibold text-[#0C1D2D] hover:bg-[#F0E5D3]">Guest upload page ↗</a>
        </div>
      </section>
      <section class="panel space-y-4" aria-label="Event branding">
       <h2 class="text-xl font-bold">Event branding &amp; guest appearance</h2>
       <p class="text-sm text-[#536273]">Cover photos are separate from guest memories and are available in the QR poster designer.</p>
       <p v-if="brandingError" role="alert" class="text-red-700">{{brandingError}}</p>
       <div v-if="branding.cover_url" class="relative max-w-md"><img :src="branding.cover_url" alt="Event cover preview" class="h-44 w-full rounded-lg object-cover" /><button class="mt-2 text-sm underline" type="button" :disabled="coverBusy" @click="removeCover">Remove cover</button></div>
       <label class="block text-sm font-semibold">{{branding.cover_url?'Replace':'Upload'}} cover photo (JPEG, PNG or WebP, up to 10 MB)<input class="input mt-2" type="file" accept="image/jpeg,image/png,image/webp" :disabled="coverBusy" @change="uploadCover" /></label>
       <div class="space-y-4 rounded-xl border border-[#D6B077] p-4" aria-label="Guest experience messages">
        <div><h3 class="font-semibold">Guest welcome &amp; upload confirmation</h3><p class="text-xs text-[#536273]">Leave any field blank to use the standard EventKeepsakes wording. These messages appear on the guest page.</p></div>
        <label class="block text-sm font-semibold">Upload section heading <input v-model="branding.guest_intro_title" maxlength="100" class="input mt-2" placeholder="Share your favourite moments" /></label>
        <label class="block text-sm font-semibold">Upload instructions <textarea v-model="branding.guest_upload_instructions" maxlength="500" rows="3" class="input mt-2" placeholder="Add photos and videos from your phone or computer. No account needed." /></label>
        <label class="block text-sm font-semibold">Thank-you heading <input v-model="branding.guest_thank_you_title" maxlength="100" class="input mt-2" placeholder="Thank you for sharing!" /></label>
        <label class="block text-sm font-semibold">Thank-you message <textarea v-model="branding.guest_thank_you_message" maxlength="500" rows="3" class="input mt-2" placeholder="Your memories have been received. Thank you for celebrating with us!" /></label>
        <div class="rounded-lg bg-[#FFFDF8] p-4 text-center" aria-label="Thank-you preview">
         <p class="text-xs uppercase tracking-widest" :style="{color:themeAccent}">Upload complete</p>
         <h4 class="mt-2 text-xl font-bold">{{branding.guest_thank_you_title||'Thank you for sharing!'}}</h4>
         <p class="mt-2 whitespace-pre-wrap text-sm text-[#536273]">{{branding.guest_thank_you_message||'Your memories have been received. Thank you for celebrating with us!'}}</p>
        </div>
       </div>
       <div class="space-y-4 rounded-xl border border-[#D6B077] p-4" aria-label="Event countdown settings">
        <div><h3 class="font-semibold">Event countdown</h3><p class="text-xs text-[#536273]">Optional countdown shown on the guest page. It switches to your celebration message when the chosen time arrives.</p></div>
        <label class="flex items-center gap-3 text-sm font-semibold"><input v-model="branding.countdown_enabled" type="checkbox" /> Show countdown to event</label>
        <template v-if="branding.countdown_enabled">
         <label class="block text-sm font-semibold">Event date and time <input v-model="countdownLocal" type="datetime-local" class="input mt-2" required /></label>
         <p class="text-xs text-[#536273]">Time is entered in your device's local time zone and saved as an absolute time. Preview: {{countdownPreview}}</p>
         <label class="block text-sm font-semibold">Countdown heading <input v-model="branding.countdown_heading" maxlength="100" class="input mt-2" placeholder="The celebration begins in" /></label>
         <label class="block text-sm font-semibold">Message when countdown finishes <textarea v-model="branding.countdown_finished_message" maxlength="250" rows="2" class="input mt-2" placeholder="The celebration has begun! Welcome!" /></label>
         <div class="rounded-xl border border-[#D6B077] bg-[#FFFDF8] p-4 text-center">
          <p class="text-xs uppercase tracking-widest" :style="{color:themeAccent}">{{branding.countdown_heading||'The celebration begins in'}}</p>
          <p class="mt-2 text-sm font-semibold">Days · Hours · Minutes · Seconds</p>
          <p class="mt-2 text-xs text-[#536273]">{{countdownPreview}}</p>
         </div>
        </template>
       </div>
       <label class="block text-sm font-semibold">Welcome message<textarea v-model="branding.welcome_message" maxlength="500" rows="3" class="input mt-2" /></label>
       <div class="grid gap-4 sm:grid-cols-2">
        <label class="text-sm font-semibold">Gallery layout<select v-model="branding.gallery_layout" class="input mt-2"><option value="grid">Grid</option><option value="masonry">Masonry</option></select></label>
        <label class="text-sm font-semibold">Theme<select v-model="branding.gallery_theme" class="input mt-2"><option value="classic">Classic</option><option value="wedding">Wedding</option><option value="birthday">Birthday</option><option value="corporate">Corporate</option><option value="custom">Custom</option></select></label>
       </div>
       <label v-if="branding.gallery_theme==='custom'" class="flex items-center gap-3 text-sm">Accent colour <input v-model="branding.gallery_accent" type="color" /></label>
       <div class="grid gap-4 sm:grid-cols-3">
        <label class="text-sm font-semibold">Text alignment<select v-model="branding.hero_alignment" class="input mt-2"><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option></select></label>
        <label class="text-sm font-semibold">Text colour<select v-model="branding.hero_text_color" class="input mt-2"><option value="light">Light text</option><option value="dark">Dark text</option></select></label>
        <label class="text-sm font-semibold">Overlay strength: {{branding.hero_overlay??65}}%<input v-model.number="branding.hero_overlay" type="range" min="0" max="90" step="5" class="mt-4 w-full" /></label>
       </div>
       <div class="space-y-3 rounded-xl border border-[#D6B077] p-4">
        <div class="space-y-3 pb-4">
         <h3 class="font-semibold">Complete event themes</h3>
         <p class="text-sm text-[#536273]">Choose a ready-made design, then fine-tune any option below. Your cover photo and messages are preserved. Save to publish.</p>
         <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button v-for="preset in eventThemePresets" :key="preset.id" type="button"
           class="rounded-xl border p-3 text-left transition hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
           :class="chosenThemePreset===preset.id?'border-[#A77B42] ring-2 ring-[#D6B077]':'border-[#D6B077]'"
           :aria-pressed="chosenThemePreset===preset.id"
           @click="applyThemePreset(preset.id)">
           <span class="mb-2 block h-2 w-14 rounded-full" :style="{background:preset.gallery_accent}"></span>
           <span class="block font-semibold">{{preset.label}}</span>
           <span class="mt-1 block text-xs text-[#536273]">{{preset.subtitle}}</span>
          </button>
         </div>
        </div>
        <h3 class="font-semibold">Hero design templates</h3>
        <label class="block text-sm font-semibold">Text colour template<select v-model="branding.hero_palette" class="input mt-2"><option value="classic-ivory">Classic Ivory</option><option value="midnight-gold">Midnight Gold</option><option value="romantic-blush">Romantic Blush</option><option value="elegant-charcoal">Elegant Charcoal</option><option value="botanical-sage">Botanical Sage</option><option value="modern-white">Modern White</option></select></label>
        <label class="block text-sm font-semibold">Photo overlay<select v-model="branding.hero_effect" class="input mt-2"><option value="soft-gradient">Soft Gradient</option><option value="romantic-glow">Romantic Glow</option><option value="cinematic-dark">Cinematic Dark</option><option value="clean-natural">Clean &amp; Natural</option><option value="frosted-glass">Frosted Glass</option><option value="vintage-sepia">Vintage Sepia</option><option value="full-colour-tint">Full Colour Tint</option></select></label>
        <label class="block text-sm font-semibold">Decorative elements<select v-model="branding.hero_decoration" class="input mt-2"><option value="none">None</option><option value="hearts">Hearts &amp; Lines</option><option value="lines">Elegant Lines</option><option value="floral">Floral Flourish</option></select></label>
       </div>
       <p class="text-xs text-[#536273]">Live preview — your cover photo stays watermark-free. Adjust the overlay to keep the text readable.</p>
       <div v-if="branding.cover_url" class="relative isolate flex min-h-64 flex-col justify-end overflow-hidden rounded-xl" :class="branding.hero_alignment==='left'?'items-start text-left':branding.hero_alignment==='right'?'items-end text-right':'items-center text-center'">
        <img :src="branding.cover_url" alt="Cover preview" class="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div class="absolute inset-0 -z-10" :style="{background:heroDesign(branding).overlay}" aria-hidden="true"></div>
        <div class="w-full space-y-2 px-5 pb-6 pt-20" :style="{textAlign:branding.hero_alignment||'center',color:heroDesign(branding).text,textShadow:heroDesign(branding).shadow}"><p class="text-xs uppercase tracking-widest" :style="{color:heroDesign(branding).accent}">Capture · Share · Remember</p><p v-if="heroDecoration(branding)" class="text-xl" :style="{color:heroDesign(branding).accent}">{{heroDecoration(branding)}}</p><h3 class="text-2xl font-bold">{{event.title}}</h3><p class="whitespace-pre-wrap text-sm">{{branding.welcome_message||'Welcome to our event!'}}</p><p v-if="event.description" class="whitespace-pre-wrap text-sm">{{event.description}}</p></div>
       </div>
       <div v-else class="rounded-xl border p-4 text-center" :style="{borderColor:themeAccent}"><h3 class="text-xl font-bold">{{event.title}}</h3><p class="mt-2 whitespace-pre-wrap text-sm">{{branding.welcome_message||'Welcome to our event!'}}</p></div>
       <button type="button" class="btn" :disabled="brandingBusy" @click="saveBranding">{{brandingBusy?'Saving…':'Save guest appearance'}}</button>
      </section>
      <section class="panel space-y-4" aria-label="Event package and storage">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div><h2 class="text-xl font-semibold text-[#0C1D2D]">Event Package &amp; Storage</h2><p class="text-sm text-[#536273]">Your current package and original media storage.</p></div>
          <NuxtLink :to="`/dashboard/events/${event.id}/packages`" class="btn">View / Upgrade Package →</NuxtLink>
        </div>
        <p v-if="storageLoading" class="text-sm text-[#536273]">Loading storage details…</p>
        <p v-if="storageError" class="text-sm text-red-700" role="alert">{{ storageError }} <button type="button" class="underline" @click="loadStorage">Retry</button></p>
        <template v-if="storage">
          <div class="flex flex-wrap justify-between gap-4">
            <div><p class="text-xs text-[#536273]">Current package</p><p class="text-lg font-semibold">{{ storage.packageName }}</p></div>
            <div><p class="text-xs text-[#536273]">Storage allowance</p><p class="text-lg font-semibold">{{ formatBytes(storage.limitBytes) }}</p></div>
          </div>
          <p v-if="storage.activationWarning" class="rounded-lg border border-amber-400 p-3 text-sm text-amber-900" role="status">A payment was recorded, but the active storage allowance could not be matched to that package. Check the Stripe webhook activation.</p>
          <div class="flex justify-between gap-2 text-sm"><span>Storage used</span><span>{{ formatBytes(storage.usedBytes) }} / {{ formatBytes(storage.limitBytes) }}</span></div>
          <div class="h-3 overflow-hidden rounded-full bg-[#E4D8C5]" role="progressbar" :aria-valuenow="usedPercent" aria-valuemin="0" aria-valuemax="100" aria-label="Event storage used"><div class="h-full rounded-full bg-[#B18A50]" :style="{width:`${usedPercent}%`}" /></div>
          <div class="flex flex-wrap justify-between gap-2 text-xs text-[#536273]"><span>{{ usedPercent }}% used · {{ storage.files }} uploaded files</span><span>{{ formatBytes(storage.remainingBytes) }} remaining</span></div>
          <p class="text-xs text-[#536273]">{{ storage.expiresAt ? `Package expires ${new Date(storage.expiresAt).toLocaleDateString('en-AU')}` : 'No package expiry currently set' }}</p>
          <button type="button" class="text-sm font-medium text-[#90612E] underline" @click="loadStorage">Refresh storage</button>
        </template>
      </section>
      <section class="panel flex flex-wrap items-center justify-between gap-4" aria-label="QR welcome sign designer">
        <div><h2 class="text-xl font-semibold text-[#0C1D2D]">QR Welcome Sign Designer</h2><p class="mt-1 text-sm text-[#536273]">Create a personalised A4 or A5 printable sign for your guests.</p></div>
        <NuxtLink :to="`/dashboard/events/${event.id}/sign`" class="btn">Design Welcome Sign →</NuxtLink>
      </section>
      <section class="panel flex flex-wrap items-center justify-between gap-4" aria-label="Guest media management">
        <div>
          <h2 class="text-xl font-semibold text-[#0C1D2D]">Guest Media Management</h2>
          <p class="mt-1 text-sm text-[#536273]">Review, approve and manage guest photos and videos.</p>
        </div>
        <NuxtLink :to="`/dashboard/events/${event.id}/media`" class="btn">Manage Photos &amp; Videos →</NuxtLink>
      </section>
      <div class="grid gap-6 lg:grid-cols-[1fr_280px]">
        <form class="panel space-y-5" @submit.prevent="save">
          <h2 class="text-xl font-semibold">Event details</h2>
          <label class="block text-sm">Event name<input v-model="event.title" maxlength="150" required class="input mt-2" /></label>
          <label class="block text-sm">Description<textarea v-model="event.description" maxlength="3000" rows="3" class="input mt-2" /></label>
          <div class="grid sm:grid-cols-2 gap-4">
            <label class="block text-sm">Event date<input v-model="event.event_date" type="date" class="input mt-2" /></label>
            <label class="block text-sm">Status<select v-model="event.status" class="input mt-2"><option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</option></select></label>
          </div>
          <h2 class="text-xl font-semibold pt-3">Upload schedule</h2>
          <p class="text-xs text-[#536273]">Times are entered in your browser's local timezone and saved as UTC. The timezone label is used for event display; enter times using the browser timezone for this release.</p>
          <label class="block text-sm">Event timezone<input v-model="event.timezone" class="input mt-2" placeholder="Australia/Melbourne" /></label>
          <div class="grid sm:grid-cols-2 gap-4">
            <label class="block text-sm">Uploads open<input v-model="startsLocal" type="datetime-local" class="input mt-2" /></label>
            <label class="block text-sm">Uploads close<input v-model="endsLocal" type="datetime-local" class="input mt-2" /></label>
          </div>
          <h2 class="text-xl font-semibold pt-3">Guest settings</h2>
          <label class="block text-sm">Gallery visibility<select v-model="event.gallery_visibility" class="input mt-2"><option value="private">Private — event holder only</option><option value="shared">Shared — guests can view approved uploads</option></select></label>
          <label class="block text-sm">Guest name<select v-model="event.guest_name_mode" class="input mt-2"><option value="required">Required</option><option value="optional">Optional</option><option value="disabled">Disabled</option></select></label>
          <label class="flex items-center gap-3"><input v-model="event.moderation_enabled" type="checkbox" /> Approve guest uploads before sharing</label>
          <label class="flex items-center gap-3"><input v-model="event.guest_downloads_enabled" type="checkbox" /> Allow guest downloads</label>
          <label class="flex items-center gap-3"><input v-model="event.show_contributor_names" type="checkbox" /> Show contributor names</label>
          <button class="btn" :disabled="saving">{{ saving ? 'Saving…' : 'Save settings' }}</button>
        </form>
        <div class="space-y-6">
          <div class="panel space-y-4"><h2 class="text-xl font-semibold">Guest QR code</h2>
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="Event guest link QR code" class="w-full rounded-lg bg-white p-2" />
            <input :value="guestUrl" readonly class="input text-xs" aria-label="Guest URL" />
            <div class="flex flex-wrap gap-2"><button type="button" class="btn" @click="copyLink">Copy link</button><button type="button" class="btn" @click="downloadQr">Download QR</button></div>
            <p class="text-xs text-[#536273]">This QR code is permanent. Guest uploads are available in Phase 3.</p>
          </div>
          <form class="panel space-y-4" @submit.prevent="savePin"><h2 class="text-xl font-semibold">Optional event PIN</h2>
            <p class="text-sm text-[#536273]">{{ event.pin_enabled ? 'A PIN is configured.' : 'No PIN is configured.' }} PIN protection is enforced for guest uploads and galleries.</p>
            <label class="block text-sm">New PIN (4–8 digits)<input v-model="pin" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8" class="input mt-2" placeholder="Leave blank to disable" /></label>
            <button class="btn" :disabled="pinSaving">{{ pinSaving ? 'Updating…' : 'Save PIN / disable' }}</button>
          </form>
        </div>
      </div>
    </div>
    <p v-else class="text-red-700">{{ error || 'Event not found or you do not have access.' }}</p>
  </div>
</template>
