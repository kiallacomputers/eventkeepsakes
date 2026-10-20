
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

async function signOut() {
  await client.auth.signOut()
  await navigateTo('/')
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F4EB] text-[#0C1D2D]">

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
          <NuxtLink to="/packages"  class="text-sm font-medium text-[#0C1D2D] transition hover:text-[#B18A50]">Packages</NuxtLink>
          <template v-if="showAccountNavigation">
          <NuxtLink
            to="/dashboard"
            class="text-sm font-medium text-[#0C1D2D]
                   transition hover:text-[#B18A50]"
          >
            Dashboard
          </NuxtLink>

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

  </div>
</template>
