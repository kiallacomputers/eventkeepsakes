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

const appearance=ref({welcome_message:'',layout:'grid',theme:'classic',accent_color:'#B18A50',cover_media_id:null as string|null})
const coverChoices=ref<any[]>([])
const appearanceError=ref(''),appearanceSaving=ref(false)
const accents:Record<string,string>={classic:'#B18A50',wedding:'#B58A98',birthday:'#8C67B1',corporate:'#376A86'}
const previewAccent=computed(()=>appearance.value.theme==='custom'?appearance.value.accent_color:accents[appearance.value.theme]||accents.classic)
async function loadAppearance(){try{
 const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in required')
 const headers={authorization:`Bearer ${session.access_token}`}
 const [style,files]=await Promise.all([$fetch<any>('/api/owner/gallery-style',{query:{id:String(route.params.id)},headers}),$fetch<any>('/api/owner/media',{query:{id:String(route.params.id)},headers})])
 appearance.value={...appearance.value,...style}
 coverChoices.value=(files.media||[]).filter((m:any)=>m.media_type==='image'&&m.status==='approved')
}catch(e:any){appearanceError.value=e?.data?.statusMessage||e?.message||'Unable to load gallery settings'}}
async function saveAppearance(){if(appearanceSaving.value)return;appearanceSaving.value=true;appearanceError.value=''
 try{const {data:{session}}=await client.auth.getSession();if(!session)throw new Error('Sign in required')
 await $fetch('/api/owner/gallery-style',{method:'PUT',headers:{authorization:`Bearer ${session.access_token}`},body:{id:String(route.params.id),...appearance.value}})
 dialog.show('Gallery appearance saved.','success')
 }catch(e:any){appearanceError.value=e?.data?.statusMessage||e?.message||'Unable to save gallery settings'}finally{appearanceSaving.value=false}}
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
onMounted(() => { windowOrigin.value = window.location.origin; load(); loadStorage(); loadOverview(); loadAppearance() })
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
      <section class="panel space-y-4" aria-label="Guest gallery appearance">
       <h2 class="text-xl font-semibold">Guest gallery appearance</h2>
       <p class="text-sm text-[#536273]">Personalise your guest experience. Preview updates as you edit; guests see saved changes.</p>
       <p v-if="appearanceError" role="alert" class="text-red-700">{{appearanceError}}</p>
       <label class="block text-sm font-semibold">Welcome message<textarea v-model="appearance.welcome_message" maxlength="500" rows="3" class="mt-1 w-full rounded-lg border border-[#D6B077] bg-white p-3" placeholder="Welcome to our event!" /></label>
       <div class="grid gap-3 sm:grid-cols-2">
        <label class="text-sm font-semibold">Gallery layout<select v-model="appearance.layout" class="mt-1 w-full rounded-lg border border-[#D6B077] bg-white p-3"><option value="grid">Grid</option><option value="masonry">Masonry</option></select></label>
        <label class="text-sm font-semibold">Theme<select v-model="appearance.theme" class="mt-1 w-full rounded-lg border border-[#D6B077] bg-white p-3"><option value="classic">Classic</option><option value="wedding">Wedding</option><option value="birthday">Birthday</option><option value="corporate">Corporate</option><option value="custom">Custom</option></select></label>
       </div>
       <label v-if="appearance.theme==='custom'" class="flex items-center gap-3 text-sm">Custom accent colour<input v-model="appearance.accent_color" type="color" /></label>
       <label class="block text-sm font-semibold">Event cover photo<select v-model="appearance.cover_media_id" class="mt-1 w-full rounded-lg border border-[#D6B077] bg-white p-3"><option :value="null">No cover photo</option><option v-for="m in coverChoices" :key="m.id" :value="m.id">{{m.original_name||m.id}}</option></select><span class="block text-xs font-normal text-[#536273]">Choose an approved event photo. The cover remains protected by gallery access and watermarking.</span></label>
       <div class="rounded-xl border bg-[#FFFDF8] p-5 text-center space-y-2" :style="{borderColor:previewAccent}">
        <p class="text-xs uppercase tracking-widest" :style="{color:previewAccent}">Live guest preview</p><h3 class="text-2xl font-bold">{{event.title}}</h3>
        <p class="whitespace-pre-wrap text-sm">{{appearance.welcome_message||'Your welcome message appears here.'}}</p>
        <p class="text-xs" :style="{color:previewAccent}">{{appearance.layout==='masonry'?'Masonry':'Grid'}} gallery · {{appearance.theme}} theme</p>
       </div>
       <button type="button" class="btn" :disabled="appearanceSaving" @click="saveAppearance">{{appearanceSaving?'Saving…':'Save gallery appearance'}}</button>
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
