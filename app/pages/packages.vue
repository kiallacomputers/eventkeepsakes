<script setup lang="ts">
import { estimatePhotoCount } from '~/utils/photoCapacity'

type Plan = { id: string; display_name: string; storage_limit_bytes: number; retention_days: number; price_cents: number; currency: string }
const { data, pending, error, refresh } = await useFetch<{ plans: Plan[] }>('/api/packages')
const plans = computed(() => data.value?.plans ?? [])
const money = (cents: number, currency = 'AUD') => new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(cents / 100)
const capacity = (bytes: number) => bytes < 1073741824 ? `${Math.round(bytes / 1048576)} MB` : `${Number((bytes / 1073741824).toFixed(1))} GB`
const duration = (days: number) => days === 365 ? '12 months' : days === 730 ? '24 months' : `${days} days`
const user = useSupabaseUser()
</script>

<template>
  <main class="mx-auto max-w-6xl space-y-8 px-5 py-12">
    <header class="mx-auto max-w-2xl space-y-3 text-center">
      <p class="text-xs font-semibold uppercase tracking-[.2em] text-[#B18A50]">EventKeepsakes</p>
      <h1 class="font-serif text-4xl font-bold text-[#0C1D2D]">Packages & Pricing</h1>
      <p class="text-[#536273]">Capture and share your event memories. Choose the storage and retention that suits your celebration.</p>
    </header>
    <p v-if="pending" class="text-center text-[#536273]" role="status">Loading packages…</p>
    <div v-else-if="error" class="panel space-y-3 text-center" role="alert">
      <p>Packages are unavailable right now. Please try again.</p>
      <button class="btn" type="button" @click="refresh()">Try again</button>
    </div>
    <p v-else-if="!plans.length" class="text-center text-[#536273]">No packages are currently available.</p>
    <div v-else class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      <article v-for="plan in plans" :key="plan.id" class="panel flex flex-col gap-4 border border-[#E4D8C5] bg-[#FFFDF8]">
        <div>
          <h2 class="font-serif text-2xl font-semibold text-[#0C1D2D]">{{ plan.display_name }}</h2>
          <p class="mt-2 text-3xl font-bold text-[#0C1D2D]">{{ money(plan.price_cents, plan.currency) }}</p>
          <p class="mt-1 text-sm text-[#536273]">One-time package purchase</p>
        </div>
        <div class="space-y-2 text-[#0C1D2D]">
          <p><strong>{{ capacity(plan.storage_limit_bytes) }}</strong> storage</p>
          <p><strong>~{{ estimatePhotoCount(plan.storage_limit_bytes).toLocaleString('en-AU') }}</strong> photos estimated</p>
          <p><strong>{{ duration(plan.retention_days) }}</strong> retention</p>
        </div>
        <p class="text-xs text-[#64748B]">Photo estimate assumes an average 5 MB image. Videos and larger photos use more space.</p>
        <NuxtLink :to="user ? '/dashboard' : '/register'" class="btn mt-auto block text-center">
          {{ user ? 'Choose for an event' : 'Get started' }}
        </NuxtLink>
      </article>
    </div>
    <p class="text-center text-sm text-[#536273]">Already have an event? Open it from your dashboard to purchase or upgrade its package.</p>
  </main>
</template>
