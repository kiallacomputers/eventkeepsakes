<template>
  <div class="min-h-screen bg-[#0C1D2D] text-[#F8F4EB]">
    <header class="border-b border-[#B99055]/25 bg-[#0B1B2B]/95">
      <nav class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <NuxtLink to="/" class="flex shrink-0 items-center gap-3" aria-label="EventKeepsakes home">
          <img src="/branding/eventkeepsakes-icon.png" alt="" class="h-12 w-14 rounded-lg bg-white object-contain p-1" />
          <span class="text-lg font-semibold tracking-wide text-[#F5E8D3]">Event<span class="text-[#D6B077]">Keepsakes</span></span>
        </NuxtLink>
        <div class="flex items-center gap-5 text-sm font-medium">
          <NuxtLink to="/dashboard" class="text-[#E6D9C4] hover:text-[#E9C38B]">Dashboard</NuxtLink>
          <NuxtLink to="/auth/login" class="rounded-lg border border-[#C6A06C]/50 px-4 py-2 text-[#E9C38B] hover:bg-[#C6A06C]/10">Account</NuxtLink>
        </div>
      </nav>
    </header>
    <main><NuxtPage /></main>
    <footer class="mt-16 border-t border-[#C6A06C]/20 px-5 py-8 text-center text-xs text-[#C9BBA8]">EventKeepsakes · Capture · Share · Remember <span class="mx-2">|</span> by Kialla Computers</footer>
  </div>
</template>
