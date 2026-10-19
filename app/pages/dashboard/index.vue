<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const client = useSupabaseClient()
const user = useSupabaseUser()
const events = ref<any[]>([]), name = ref(''), eventDate = ref(''), error = ref(''), busy = ref(false)
async function load() { const { data, error: err } = await client.from('events').select('id,title,event_date,slug,status').order('created_at', { ascending: false }); if (err) error.value = err.message; else events.value = data || [] }
async function createEvent() { if (!user.value) return; busy.value = true; error.value = ''; const { error: err } = await client.from('events').insert({ owner_id: user.value.id, title: name.value.trim(), event_date: eventDate.value || null, slug: crypto.randomUUID(), status: 'draft' }); if (err) error.value = err.message; else { name.value = ''; eventDate.value = ''; await load() } busy.value = false }
async function signOut() { await client.auth.signOut(); await navigateTo('/') }
onMounted(load)
</script>
<template><div class="mx-auto max-w-5xl px-5 py-12"><div class="flex items-center justify-between gap-4"><h1 class="text-3xl font-bold">My events</h1><button class="text-teal-300" @click="signOut">Sign out</button></div><p class="text-slate-400 mt-3">Create an event to get started. QR uploads and galleries arrive in Phase 2–3.</p><form class="panel mt-8 space-y-4" @submit.prevent="createEvent"><h2 class="font-semibold text-xl">New event</h2><input v-model="name" class="input" required maxlength="150" placeholder="Event name"/><input v-model="eventDate" class="input" type="date"/><p v-if="error" class="text-red-300" role="alert">{{ error }}</p><button class="btn" :disabled="busy">{{ busy ? 'Saving…' : 'Create event' }}</button></form><div class="grid md:grid-cols-2 gap-4 mt-8"><div v-for="event in events" :key="event.id" class="panel"><h3 class="text-xl font-semibold">{{ event.title }}</h3><p class="text-slate-400 text-sm mt-2">{{ event.event_date || 'Date not set' }} · {{ event.status }}</p><p class="text-xs text-slate-500 mt-3">Event ID: {{ event.id }}</p></div><p v-if="!events.length" class="text-slate-400">No events yet.</p></div></div></template>
