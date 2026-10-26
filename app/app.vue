<script setup lang="ts">
const route = useRoute()
const user = useSupabaseUser()

// The top navigation is resolved from the same authenticated session used
// by the Administration pages. Do not rely on a hydration-time user/token pair.
const isGuestPage = computed(() => route.path.startsWith('/e/'))
const client = useSupabaseClient()
const staffRole = ref<'admin' | 'manager' | 'superadmin' | null>(null)
const signedIn = ref(false)
const navigationReady = ref(false)
const showAccountNavigation = computed(() => !isGuestPage.value && signedIn.value)
let checkNumber = 0

async function refreshNavigation() {
  const current = ++checkNumber
  navigationReady.value = false
  try {
    // getSession() works for the original SuperAdmin and database-backed staff
    // and is already used by the functioning /admin page.
    const { data, error } = await client.auth.getSession()
    if (current !== checkNumber) return
    const token = error ? null : data.session?.access_token
    if (!token) {
      signedIn.value = false
      staffRole.value = null
      return
    }
    const result = await $fetch<{
      allowed: boolean
      role: 'admin' | 'manager' | 'superadmin' | null
    }>('/api/admin/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (current !== checkNumber) return
    signedIn.value = true
    staffRole.value = result.allowed ? result.role : null
  } catch (error) {
    if (current !== checkNumber) return
    // Do not hide the ordinary account links because a role check failed.
    const { data } = await client.auth.getSession()
    if (current !== checkNumber) return
    signedIn.value = !!data.session
    staffRole.value = null
    console.error('Unable to load Administration menu permissions', error)
  } finally {
    if (current === checkNumber) navigationReady.value = true
  }
}

// Client-only initialisation prevents a partial menu from being painted.
// Auth changes (including hydration, login and logout) trigger another check.
let unsubscribeAuth: (() => void) | null = null
onMounted(() => {
  void refreshNavigation()
  const { data: listener } = client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
      // Avoid calling Supabase methods synchronously inside its auth callback.
      Promise.resolve().then(() => refreshNavigation())
    }
  })
  unsubscribeAuth = () => listener.subscription.unsubscribe()
})
onUnmounted(() => unsubscribeAuth?.())

async function signOut() {
  signedIn.value = false
  staffRole.value = null
  await client.auth.signOut()
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F4EB] text-[#0C1D2D]">
    <!-- Render the page and its complete navigation together, never incrementally. -->
    <div v-if="!isGuestPage && !navigationReady" class="min-h-screen" aria-busy="true">
      <div class="border-b border-[#E4D8C5]">
        <div class="mx-auto flex max-w-7xl items-center px-5 py-5 min-h-[90px]">
          <span class="font-serif text-2xl font-bold">Event<span class="text-[#B18A50]">Keepsakes</span></span>
        </div>
      </div>
    </div>
    <template v-else>

    <!-- Main Header -->
    <header v-if="!isGuestPage" class="border-b border-[#E4D8C5] bg-[#F8F4EB]">
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
    <main :class="isGuestPage ? 'min-h-screen' : 'min-h-[calc(100vh-180px)]'">
      <NuxtPage />
    </main>

    <AppDialog />

    <!-- Footer -->
    <footer
      v-if="!isGuestPage"
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

    <!-- Guest-only unobtrusive footer: the event itself remains the focus. -->
    <footer v-if="isGuestPage" class="border-t border-[#E4D8C5]/70 bg-[#F8F4EB] px-5 py-5 text-center" aria-label="Platform information">
      <NuxtLink to="/" class="inline-flex items-center gap-2 rounded-md text-sm text-[#64748B] transition hover:text-[#0C1D2D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B18A50]">
        <span>Powered by</span>
        <span class="font-serif font-semibold text-[#0C1D2D]">Event<span class="text-[#B18A50]">Keepsakes</span></span>
      </NuxtLink>
      <p class="mt-1 text-[11px] tracking-wide text-[#8A8276]">Capture · Share · Remember</p>
    </footer>

    </template>
  </div>
</template>
