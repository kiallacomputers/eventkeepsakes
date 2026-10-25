<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const client = useSupabaseClient()
const allowed = ref(false)
const role = ref<string|null>(null)
const loading = ref(true)
onMounted(async () => {
  try {
    const { data } = await client.auth.getSession()
    const result = await $fetch<{ allowed: boolean; role: string|null }>('/api/admin/me', {
      headers: { Authorization: `Bearer ${data.session?.access_token || ''}` }
    })
    allowed.value = result.allowed
    role.value = result.role
  } catch { allowed.value = false }
  finally { loading.value = false }
})
</script>
<template>
  <div class="mx-auto max-w-5xl px-5 py-16">
    <p v-if="loading">Checking administrator access…</p>
    <div v-else-if="allowed">
      <h1 class="text-3xl font-bold">Administration</h1>
      <p class="text-[#536273] mt-4">Manage EventKeepsakes settings and business operations.</p>
      <div class="mt-6 flex flex-wrap gap-3">\n        <NuxtLink to="/admin/support" class="btn">Customer &amp; Event Support</NuxtLink>
        <NuxtLink v-if="role==='superadmin'||role==='manager'" to="/admin/packages" class="btn">Manage Packages</NuxtLink>
        <NuxtLink v-if="role==='superadmin'||role==='manager'" to="/admin/finance" class="btn">Financial Dashboard</NuxtLink>
        <NuxtLink v-if="role==='superadmin'||role==='manager'" to="/admin/retention" class="btn">Retention &amp; Recovery</NuxtLink>
      <NuxtLink v-if="role==='superadmin'" to="/admin/staff" class="btn">Manage Staff</NuxtLink>
      </div>
      <p v-if="role==='admin'" class="mt-5 text-sm text-[#536273]">Your Admin access is active. Use Customer &amp; Event Support for customer assistance; financial and system settings are restricted.</p>
    </div>
    <div v-else class="panel"><h1 class="text-2xl font-bold">Access denied</h1><p class="text-[#536273] mt-3">This account is not authorised as staff.</p></div>
  </div>
</template>
