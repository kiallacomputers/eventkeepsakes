<template>
  <section class="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
    <div>
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-[#956B34]">For weddings, celebrations & corporate events</p>
      <h1 class="mt-6 text-5xl font-semibold leading-tight md:text-6xl">Beautiful memories, <span class="text-[#956B34]">shared together.</span></h1>
      <p class="mt-7 max-w-xl text-lg leading-relaxed text-[#536273]">Give every guest a simple way to contribute their photos and videos. Create an event, share one QR code, and bring every perspective together.</p>
      <div class="mt-9 flex flex-wrap items-center gap-4"><NuxtLink class="btn" to="/auth/register">Create your event</NuxtLink><NuxtLink class="rounded-lg border border-[#B68C53]/60 px-5 py-3 text-[#90612E] hover:bg-[#F0E4D1]" to="/auth/login">Sign in</NuxtLink></div>
      <p class="mt-8 text-sm text-[#647080]">Capture · Share · Remember</p>
    </div>
    <div class="overflow-hidden rounded-3xl border border-[#B68C53]/40 bg-[#FFFCF6] p-4 shadow-2xl shadow-[#0C1D2D]/10">
      <img src="/branding/eventkeepsakes-logo.png" alt="EventKeepsakes logo — Capture, Share, Remember" class="h-auto w-full" />
    </div>
  </section>
</template>
