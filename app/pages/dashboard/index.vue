<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const client = useSupabaseClient()
const events = ref<any[]>([])
const name = ref('')
const eventDate = ref('')
const createCover=ref<File|null>(null)
const createWelcome=ref('')
const createTheme=ref('classic')
const createLayout=ref('grid')
const createAccent=ref('#B18A50')
const createCoverPreview=ref('')
function chooseCreateCover(e:Event){const file=(e.target as HTMLInputElement).files?.[0]||null;createCover.value=file;if(createCoverPreview.value)URL.revokeObjectURL(createCoverPreview.value);createCoverPreview.value=file?URL.createObjectURL(file):''}

const error = ref('')
const busy = ref(false)
const loading = ref(true)
async function load() {
  loading.value = true
  const { data, error: err } = await client.from('events').select('id,title,event_date,slug,status').order('created_at', { ascending: false })
  if (err) error.value = err.message
  else events.value = data || []
  loading.value = false
}
async function createEvent() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const title = name.value.trim()
    if (!title) throw new Error('Please enter an event name.')
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError || !user) throw new Error('Please sign in again.')
    const { data, error: insertError } = await client.from('events').insert({ owner_id: user.id, title, event_date: eventDate.value || null, slug: crypto.randomUUID(), status: 'draft' }).select('id').single()
    if (insertError) throw insertError
    const {data:{session}}=await client.auth.getSession()
    if(!session)throw new Error('Sign in again to finish branding')
    const headers={authorization:`Bearer ${session.access_token}`}
    await $fetch('/api/owner/branding',{method:'PUT',headers,body:{id:data.id,welcome_message:createWelcome.value,gallery_theme:createTheme.value,gallery_layout:createLayout.value,gallery_accent:createAccent.value}})
    if(createCover.value){const form=new FormData();form.append('id',data.id);form.append('file',createCover.value);await $fetch('/api/owner/cover',{method:'POST',headers,body:form})}
    name.value = '' 
    eventDate.value = ''
    await navigateTo(`/dashboard/events/${data.id}`)
  } catch (e: any) { error.value = e.message || 'Unable to create event.' }
  finally { busy.value = false }
}
async function signOut() { await client.auth.signOut(); await navigateTo('/') }
onMounted(load)
</script>
<template>
  <div class="mx-auto max-w-5xl px-5 py-12">
    <div class="flex items-center justify-between gap-4"><h1 class="text-3xl font-bold">My events</h1><button class="text-[#90612E]" @click="signOut">Sign out</button></div>
    <p class="text-[#536273] mt-3">Manage your events, QR codes and guest settings.</p>
    <form class="panel mt-8 space-y-4" @submit.prevent="createEvent">
      <h2 class="font-semibold text-xl">Create an event</h2>
      <label class="block text-sm">Event name<input v-model="name" class="input mt-2" required maxlength="150" placeholder="Event name" /></label>
      <label class="block text-sm">Event date<input v-model="eventDate" class="input mt-2" type="date" /></label>
      <label class="block text-sm">Welcome message<textarea v-model="createWelcome" maxlength="500" rows="2" class="input mt-2" placeholder="Welcome! Share your memories…" /></label>
      <div class="grid gap-3 sm:grid-cols-2"><label class="text-sm">Theme<select v-model="createTheme" class="input mt-2"><option value="classic">Classic</option><option value="wedding">Wedding</option><option value="birthday">Birthday</option><option value="corporate">Corporate</option><option value="custom">Custom</option></select></label><label class="text-sm">Gallery layout<select v-model="createLayout" class="input mt-2"><option value="grid">Grid</option><option value="masonry">Masonry</option></select></label></div>
      <label v-if="createTheme==='custom'" class="flex items-center gap-3 text-sm">Accent colour <input v-model="createAccent" type="color" /></label>
      <label class="block text-sm">Cover photo (optional, not part of gallery)<input type="file" accept="image/jpeg,image/png,image/webp" class="input mt-2" @change="chooseCreateCover" /></label>
      <img v-if="createCoverPreview" :src="createCoverPreview" alt="Cover preview" class="h-36 w-full rounded-lg object-cover" />
      <p v-if="error" class="text-red-700" role="alert">{{ error }}</p>
      <button class="btn" :disabled="busy">{{ busy ? 'Creating…' : 'Create event' }}</button>
    </form>
    <p v-if="loading" class="mt-8 text-[#536273]">Loading events…</p>
    <div v-else class="grid md:grid-cols-2 gap-4 mt-8">
      <NuxtLink v-for="event in events" :key="event.id" :to="`/dashboard/events/${event.id}`" class="panel block hover:border-[#D6B077]">
        <h3 class="text-xl font-semibold">{{ event.title }}</h3>
        <p class="text-[#536273] text-sm mt-2">{{ event.event_date || 'Date not set' }} · {{ event.status }}</p>
        <p class="text-[#90612E] text-sm mt-4">Manage event →</p>
      </NuxtLink>
      <p v-if="!events.length" class="text-[#536273]">No events yet. Create your first event above.</p>
    </div>
  </div>
</template>
