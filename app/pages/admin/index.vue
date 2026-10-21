<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const client = useSupabaseClient()
const user = useSupabaseUser()
const allowed = ref(false), loading = ref(true)
onMounted(async () => { if (user.value) { const { data } = await client.from('profiles').select('role').eq('id', user.value.id).single(); allowed.value = data?.role === 'superadmin' } loading.value = false })
</script>
<template><div class="mx-auto max-w-5xl px-5 py-16"><p v-if="loading">Checking access…</p><div v-else-if="allowed"><h1 class="text-3xl font-bold">SuperAdmin</h1><p class="text-[#536273] mt-4">Manage your packages, finances and business settings.</p><div class="mt-6 flex flex-wrap gap-3"><NuxtLink to="/admin/packages" class="btn">Manage Packages</NuxtLink><NuxtLink to="/admin/finance" class="btn">Financial Dashboard</NuxtLink><NuxtLink to="/admin/retention" class="btn">Retention &amp; Recovery</NuxtLink></div></div><div v-else class="panel"><h1 class="text-2xl font-bold">Access denied</h1><p class="text-[#536273] mt-3">SuperAdmin access is required.</p></div></div></template>
