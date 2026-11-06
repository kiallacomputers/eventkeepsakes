<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const client = useSupabaseClient()
const route = useRoute()
const allowed = ref(false)
const role = ref<string | null>(null)
const loading = ref(true)
const tabs = computed(() => [
  { label: 'Overview', to: '/admin', show: true },
  { label: 'Customers & Events', to: '/admin/support', show: true },
  { label: 'Packages', to: '/admin/packages', show: role.value === 'manager' || role.value === 'superadmin' },
  { label: 'Financials', to: '/admin/finance', show: role.value === 'manager' || role.value === 'superadmin' },
  { label: 'Retention', to: '/admin/retention', show: role.value === 'manager' || role.value === 'superadmin' },
  { label: 'Storage', to: '/admin/storage', show: role.value === 'manager' || role.value === 'superadmin' },
  { label: 'Sign Templates', to: '/admin/sign-templates', show: true },
  { label: 'Staff', to: '/admin/staff', show: role.value === 'superadmin' }
].filter(t => t.show))
function active(to: string) {
  return to === '/admin' ? route.path === '/admin' : route.path === to || route.path.startsWith(to + '/')
}
onMounted(async () => {
  try {
    const { data } = await client.auth.getSession()
    const result = await $fetch<{ allowed: boolean; role: string | null }>('/api/admin/me', {
      headers: { Authorization: `Bearer ${data.session?.access_token || ''}` }
    })
    allowed.value = result.allowed
    role.value = result.role
  } catch { allowed.value = false }
  finally { loading.value = false }
})
</script>
<template>
  <div class="mx-auto w-full max-w-[1700px] px-4 sm:px-6 py-8">
    <p v-if="loading">Checking administrator access…</p>
    <template v-else-if="allowed">
      <header class="mb-6">
        <h1 class="text-3xl font-bold text-[#0C1D2D]">Administration</h1>
        <p class="text-[#536273] mt-2">Manage EventKeepsakes settings and business operations.</p>
      </header>
      <div class="flex flex-col md:flex-row items-start gap-5">
       <nav aria-label="Administration sections" class="w-full md:w-[196px] md:shrink-0 flex flex-wrap md:flex-col gap-1 rounded-xl border border-[#E2D7C5] bg-[#FFFDF9] p-2 md:sticky md:top-5">
        <NuxtLink v-for="tab in tabs" :key="tab.to" :to="tab.to"
         class="block rounded-lg px-3 py-2 text-[13px] leading-5 font-medium transition-colors"
         :class="active(tab.to)?'bg-[#0C1D2D] text-white':'text-[#0C1D2D] hover:bg-[#EEE7DB]'"
         :aria-current="active(tab.to)?'page':undefined">{{tab.label}}</NuxtLink>
       </nav>
       <div class="min-w-0 flex-1 w-full">
        <NuxtPage />
       </div>
      </div>
    </template>
    <div v-else class="panel">
      <h2 class="text-2xl font-bold">Access denied</h2>
      <p class="text-[#536273] mt-3">This account is not authorised as staff.</p>
    </div>
  </div>
</template>
