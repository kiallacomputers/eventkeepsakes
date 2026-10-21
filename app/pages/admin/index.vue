<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const client = useSupabaseClient()
const allowed = ref(false)
const loading = ref(true)
onMounted(async () => {
  try {
    const { data } = await client.auth.getSession()
    const result = await $fetch<{ allowed: boolean }>('/api/admin/me', {
      headers: { Authorization: `Bearer ${data.session?.access_token || ''}` }
    })
    allowed.value = result.allowed
  } catch { allowed.value = false }
  finally { loading.value = false }
})
</script>
<template>
  <div class="mx-auto max-w-5xl px-5 py-16">
    <p v-if="loading">Checking administrator access…</p>
    <div v-else-if="allowed">
      <h1 class="text-3xl font-bold">SuperAdmin</h1>
      <p class="text-[#536273] mt-4">Manage EventKeepsakes settings and business operations.</p>
      <div class="mt-6 flex flex-wrap gap-3">
        <NuxtLink to="/admin/packages" class="btn">Manage Packages</NuxtLink>
        <NuxtLink to="/admin/finance" class="btn">Financial Dashboard</NuxtLink>
        <NuxtLink to="/admin/retention" class="btn">Retention &amp; Recovery</NuxtLink>
      </div>
    </div>
    <div v-else class="panel"><h1 class="text-2xl font-bold">Access denied</h1><p class="text-[#536273] mt-3">This account is not authorised as SuperAdmin.</p></div>
  </div>
</template>
