<script setup lang="ts">
const route = useRoute()
const user = useSupabaseUser()

// Identify public guest event pages
const isGuestPage = computed(() => {
  return route.path.startsWith('/e/')
})

// Hide account navigation from guest pages
const showAccountNavigation = computed(() => {
  return !isGuestPage.value && !!user.value
})

// Sign out
const client = useSupabaseClient()
// Resolve the menu from the reactive Supabase session, not a one-time
// getSession() snapshot. A session can arrive after the user ref hydrates.
const session = useSupabaseSession()
const staffRole = ref<string|null>(null)
const navigationReady = ref(false)
let navigationRequest = 0

watch(
  [() => user.value?.id ?? null, () => session.value?.access_token ?? null],
  async ([userId, token]) => {
    const request = ++navigationRequest
    navigationReady.value = false
    staffRole.value = null

    if (!userId) {
      navigationReady.value = true
      return
    }

    // During Supabase hydration the user may arrive before the token.
    // Wait for the reactive session to update, then re-run this watcher.
    if (!token) { navigationReady.value = true; return }

    try {
      const result = await $fetch<{ allowed: boolean; role: string|null }>('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (request !== navigationRequest) return
      staffRole.value = result.allowed ? result.role : null
    } catch (err) {
      if (request !== navigationRequest) return
      console.error('Unable to resolve staff navigation', err)
    } finally {
      if (request === navigationRequest) navigationReady.value = true
    }
  },
  { immediate: true }
)

async function signOut() {
  await client.auth.signOut()
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F4EB] text-[#0C1D2D]">
    <!-- Render the page and its complete navigation together, never incrementally. -->
    <div v-if="!navigationReady" class="min-h-screen" aria-busy="true">
      <div class="border-b border-[#E4D8C5]">
        <div class="mx-auto flex max-w-7xl items-center px-5 py-5 min-h-[90px]">
          <span class="font-serif text-2xl font-bold">Event<span class="text-[#B18A50]">Keepsakes</span></span>
        </div>
      </div>
    </div>
    <template v-else>

    <!-- Main Header -->
    <header class="border-b border-[#E4D8C5] bg-[#F8F4EB]">
      <div
        class="mx-auto flex max-w-7xl items-center
               justify-between gap-4 px-5 py-5"
      >

        <!-- EventKeepsakes Branding -->
        <NuxtLink
          to="/"
          class="flex flex-col"
        >
          <span
            class="font-serif text-2xl font-bold
                   tracking-tight text-[#0C1D2D]"
          >
            Event<span class="text-[#B18A50]">Keepsakes</span>
          </span>

          <span
            class="mt-1 text-[10px] font-semibold
                   uppercase tracking-[0.2em] text-[#B18A50]"
          >
            Capture · Share · Remember
          </span>
        </NuxtLink>

        <!-- Public packages are available without an account; account links remain private. -->
        <nav v-if="!isGuestPage" class="flex flex-wrap items-center gap-4 sm:gap-5">
          <NuxtLink to="/packages" class="text-sm font-medium text-[#0C1D2D] transition hover:text-[#B18A50]" active-class="!text-[#B18A50]">Packages</NuxtLink>
          <template v-if="showAccountNavigation">
          <NuxtLink
            to="/dashboard"
            class="text-sm font-medium text-[#0C1D2D]
                   transition hover:text-[#B18A50]"
          >
            Dashboard
          </NuxtLink>

          <NuxtLink v-if="staffRole" to="/admin" class="text-sm font-medium text-[#0C1D2D] transition hover:text-[#B18A50]" active-class="!text-[#B18A50]">Administration</NuxtLink>
          <NuxtLink
            to="/account"
            class="text-sm font-medium text-[#0C1D2D]
                   transition hover:text-[#B18A50]"
          >
            Account
          </NuxtLink>

          <button
            type="button"
            class="rounded-lg border border-[#D6B077]
                   px-4 py-2 text-sm font-medium
                   transition hover:bg-[#EDE2CF]"
            @click="signOut"
          >
            Sign out
          </button>
          </template>
        </nav>

      </div>
    </header>

    <!-- Page Content -->
    <main class="min-h-[calc(100vh-180px)]">
      <NuxtPage />
    </main>

    <AppDialog />

    <!-- Footer -->
    <footer
      class="border-t border-[#E4D8C5]
             bg-[#F8F4EB] py-6"
    >
      <div
        class="mx-auto flex max-w-7xl flex-col
               items-center justify-between
               gap-3 px-5 text-center
               md:flex-row md:text-left"
      >
        <p class="text-sm text-[#64748B]">
          © {{ new Date().getFullYear() }} EventKeepsakes
        </p>

        <p class="text-xs text-[#B18A50]">
          Capture · Share · Remember
        </p>

        <p class="text-xs text-[#64748B]">
          by Kialla Computers
        </p>
      </div>
    </footer>

    </template>
  </div>
</template>
