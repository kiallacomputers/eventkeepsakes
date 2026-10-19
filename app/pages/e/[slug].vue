<script setup lang="ts">
const route = useRoute()
const client = useSupabaseClient()
const event = ref<any>(null)
const loading = ref(true)
const error = ref('')
useHead({ title: 'Event guest page · EventKeepsakes' })
onMounted(async () => {
  const { data, error: err } = await client.rpc('get_guest_event', { p_slug: String(route.params.slug) })
  if (err) error.value = err.message
  else event.value = data?.[0] || null
  loading.value = false
})
const now = ref(Date.now())
const canUpload = computed(() => event.value?.status === 'active' && (!event.value.upload_starts_at || now.value >= new Date(event.value.upload_starts_at).getTime()) && (!event.value.upload_ends_at || now.value <= new Date(event.value.upload_ends_at).getTime()))
</script>
<template>
  <main class="mx-auto max-w-xl px-5 py-16 text-center">
    <p v-if="loading" class="text-slate-400">Loading event…</p>
    <div v-else-if="event" class="panel space-y-5">
      <h1 class="text-3xl font-bold">{{ event.title }}</h1>
      <p v-if="event.description" class="text-slate-300 whitespace-pre-wrap">{{ event.description }}</p>
      <p v-if="event.event_date" class="text-slate-400">{{ event.event_date }}</p>
      <p v-if="event.pin_enabled" class="text-amber-300">This event requires a PIN. PIN entry will be available when guest uploads launch.</p>
      <p v-if="!canUpload" class="text-slate-300">Guest uploads are not currently open.</p>
      <p v-else class="text-[#E9C38B]">Guest photo and video uploads are coming in Phase 3.</p>
      <p class="text-xs text-slate-500">No photos or videos can be uploaded from this page yet.</p>
    </div>
    <p v-else class="text-red-300">{{ error || 'Event not found.' }}</p>
  </main>
</template>
