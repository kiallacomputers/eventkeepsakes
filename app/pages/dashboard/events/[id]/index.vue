<script setup lang="ts">
import QRCode from 'qrcode'
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const client = useSupabaseClient()
const event = ref<any>(null)
const error = ref('')
const notice = ref('')
const saving = ref(false)
const loading = ref(true)
const pin = ref('')
const pinSaving = ref(false)
const qrDataUrl = ref('')
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
  } catch (e: any) { error.value = e.message || 'Unable to update PIN.' }
  finally { pinSaving.value = false }
}
function downloadQr() {
  if (!qrDataUrl.value || !event.value) return
  const a = document.createElement('a'); a.href = qrDataUrl.value; a.download = `eventkeepsakes-${event.value.slug}-qr.png`; a.click()
}
async function copyLink() { try { await navigator.clipboard.writeText(guestUrl.value); notice.value = 'Guest link copied.' } catch { error.value = 'Unable to copy. Select the link manually.' } }
onMounted(() => { windowOrigin.value = window.location.origin; load() })
</script>
<template>
  <div class="mx-auto max-w-5xl px-5 py-10 space-y-7">
    <NuxtLink to="/dashboard" class="text-[#90612E]">← My events</NuxtLink>
    <p v-if="loading" class="text-[#536273]">Loading event…</p>
    <div v-else-if="event" class="space-y-7">
      <div><h1 class="text-3xl font-bold">{{ event.title }}</h1><p class="text-[#536273] mt-2">Manage your event, sharing and access settings.</p></div>
      <p v-if="error" class="rounded-lg border border-red-500 p-3 text-red-700" role="alert">{{ error }}</p>
      <p v-if="notice" class="rounded-lg border border-teal-500 p-3 text-[#336A57]" role="status">{{ notice }}</p>
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
