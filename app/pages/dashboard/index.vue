<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const client = useSupabaseClient()
const events = ref<any[]>([])
const name = ref('')
const eventDate = ref('')
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
    <div class="flex items-center justify-between gap-4"><h1 class="text-3xl font-bold">My events</h1><button class="text-teal-300" @click="signOut">Sign out</button></div>
    <p class="text-slate-400 mt-3">Manage your events, QR codes and guest settings.</p>
    <form class="panel mt-8 space-y-4" @submit.prevent="createEvent">
      <h2 class="font-semibold text-xl">Create an event</h2>
      <label class="block text-sm">Event name<input v-model="name" class="input mt-2" required maxlength="150" placeholder="Event name" /></label>
      <label class="block text-sm">Event date<input v-model="eventDate" class="input mt-2" type="date" /></label>
      <p v-if="error" class="text-red-300" role="alert">{{ error }}</p>
      <button class="btn" :disabled="busy">{{ busy ? 'Creating…' : 'Create event' }}</button>
    </form>
    <p v-if="loading" class="mt-8 text-slate-400">Loading events…</p>
    <div v-else class="grid md:grid-cols-2 gap-4 mt-8">
      <NuxtLink v-for="event in events" :key="event.id" :to="`/dashboard/events/${event.id}`" class="panel block hover:border-teal-400">
        <h3 class="text-xl font-semibold">{{ event.title }}</h3>
        <p class="text-slate-400 text-sm mt-2">{{ event.event_date || 'Date not set' }} · {{ event.status }}</p>
        <p class="text-teal-300 text-sm mt-4">Manage event →</p>
      </NuxtLink>
      <p v-if="!events.length" class="text-slate-400">No events yet. Create your first event above.</p>
    </div>
  </div>
</template>
