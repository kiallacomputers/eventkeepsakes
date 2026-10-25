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
// Wait for Supabase to finish restoring its browser session before revealing
// the account menu. Staff permissions are always verified by the server.
const client = useSupabaseClient()
const session = useSupabaseSession()
const staffRole = ref<'admin'|'manager'|'superadmin'|null>(null)
const navigationReady = ref(false)
let lookupSequence = 0

watch(
  [() => user.value?.id ?? null, () => session.value?.access_token ?? null],
  async ([userId, accessToken]) => {
    const sequence = ++lookupSequence
    navigationReady.value = false
    staffRole.value = null

    if (!userId) {
      // No logged-in user: render public navigation immediately.
      navigationReady.value = true
      return
    }

    // Supabase can hydrate user and session at different moments.
    // Use getSession as a fallback; a subsequent reactive update reruns this watcher.
    let token = accessToken
    if (!token) {
      try {
        const {data} = await client.auth.getSession()
        token = data.session?.access_token ?? null
      } catch { /* handle below */ }
    }
    if (sequence !== lookupSequence) return
    if (!token) {
      // Never show a guessed staff role. The user can retry by reauthenticating.
      navigationReady.value = true
      return
    }

    try {
      const result = await $fetch<{allowed:boolean;role:'admin'|'manager'|'superadmin'|null}>('/api/admin/me', {
        headers: {Authorization: `Bearer ${token}`}
      })
      if (sequence !== lookupSequence) return
      staffRole.value = result.allowed ? result.role : null
    } catch (error) {
      if (sequence !== lookupSequence) return
      console.error('Administration permission check failed', error)
    } finally {
      if (sequence === lookupSequence) navigationReady.value = true
    }
  },
  {immediate:true}
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
