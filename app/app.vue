<template>
  <div class="min-h-screen bg-[#F8F4EB] text-[#0C1D2D]">
    <header class="border-b border-[#D6B077]/40 bg-[#FFFCF6]/95">
      <nav class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <NuxtLink to="/" class="flex min-w-0 items-center gap-3" aria-label="EventKeepsakes home">
          <img src="/branding/eventkeepsakes-icon.png" alt="" class="h-14 w-16 shrink-0 rounded-lg bg-[#FFFCF6] object-contain p-1" />
          <span class="flex flex-col gap-1">
            <span class="font-serif text-xl font-semibold leading-none tracking-wide text-[#0C1D2D]">EventKeepsakes</span>
            <span class="text-[10px] font-semibold uppercase tracking-[0.19em] text-[#9A713D] sm:text-xs">Capture · Share · Remember</span>
          </span>
        </NuxtLink>
        <div class="flex items-center gap-4 text-sm font-semibold">
          <NuxtLink to="/dashboard" class="text-[#0C1D2D] hover:text-[#9A713D]">Dashboard</NuxtLink>
          <NuxtLink to="/auth/login" class="rounded-lg border border-[#B68C53] px-4 py-2 text-[#0C1D2D] hover:bg-[#F0E4D1]">Account</NuxtLink>
        </div>
      </nav>
    </header>
    <main><NuxtPage /></main>
    <footer class="mt-16 border-t border-[#D6B077]/40 px-5 py-8 text-center text-xs text-[#455364]">EventKeepsakes · Capture · Share · Remember <span class="mx-2">|</span> by Kialla Computers</footer>
  </div>
</template>
