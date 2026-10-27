<script setup lang="ts">
definePageMeta({middleware:'auth'})
const route=useRoute()
const eventId=computed(()=>String(route.params.id))
</script>
<template>
 <main class="mx-auto max-w-6xl space-y-5 px-5 py-10">
  <NuxtLink :to="`/dashboard/events/${eventId}`" class="ek-back-button inline-flex items-center gap-2 rounded-lg border border-[#D6B077] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold text-[#0C1D2D]">← Back to event</NuxtLink>
  <OwnerMediaManagement :event-id="eventId" />
 </main>
</template>
