<script setup lang="ts">
useSeoMeta({
  title: 'EventKeepsakes',
  description: 'Give every guest one QR code to share their photos and videos from your wedding, celebration or corporate event.'
})
const steps = [
  { n: '1', title: 'Create your event', body: 'Set up a gallery in minutes with your own cover photo, welcome message and colours.' },
  { n: '2', title: 'Share one QR code', body: 'Print it on a welcome sign or table card. Guests scan and upload straight from their phone, with no app and no account.' },
  { n: '3', title: 'Keep every memory', body: 'Browse the gallery together and download the lot as a single album whenever you like.' }
]
const features = [
  { title: 'No app for guests', body: 'Scanning the QR code opens a simple upload page in any phone browser.' },
  { title: 'Photos and videos', body: 'Everyone’s angle in one place, from the ceremony to the last dance.' },
  { title: 'Optional PIN', body: 'Keep your gallery private to the people you invited.' },
  { title: 'Welcome sign designer', body: 'Design a printable sign with your QR code, fonts and artwork.' }
]
</script>

<template>
  <div>
    <section class="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
      <div>
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-[#956B34]">For weddings, celebrations & corporate events</p>
        <h1 class="mt-6 font-serif text-5xl font-semibold leading-tight md:text-6xl">Beautiful memories, <span class="text-[#956B34]">shared together.</span></h1>
        <p class="mt-7 max-w-xl text-lg leading-relaxed text-[#536273]">Give every guest a simple way to contribute their photos and videos. Create an event, share one QR code, and bring every perspective together.</p>
        <div class="mt-9 flex flex-wrap items-center gap-4">
          <NuxtLink class="btn" to="/auth/register">Create your event</NuxtLink>
          <NuxtLink class="btn-ghost" to="/packages">See pricing</NuxtLink>
        </div>
        <p class="mt-6 text-sm text-[#647080]">Already have an account? <NuxtLink class="font-medium text-[#90612E] underline underline-offset-2" to="/auth/login">Sign in</NuxtLink></p>
      </div>
      <div class="overflow-hidden rounded-3xl border border-[#B68C53]/40 bg-[#FFFCF6] p-4 shadow-2xl shadow-[#0C1D2D]/10">
        <img src="/branding/eventkeepsakes-logo.png" alt="EventKeepsakes logo — Capture, Share, Remember" width="1200" height="400" fetchpriority="high" class="h-auto w-full" />
      </div>
    </section>

    <section class="border-y border-[#E4D8C5] bg-[#FFFCF6] px-6 py-16" aria-labelledby="how-heading">
      <div class="mx-auto max-w-6xl">
        <h2 id="how-heading" class="text-center font-serif text-3xl font-semibold">How it works</h2>
        <ol class="mt-10 grid gap-6 md:grid-cols-3">
          <li v-for="s in steps" :key="s.n" class="rounded-2xl border border-[#E4D8C5] bg-[#F8F4EB] p-6">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[#0C1D2D] font-semibold text-[#F8F4EB]" aria-hidden="true">{{ s.n }}</span>
            <h3 class="mt-4 font-serif text-xl font-semibold">{{ s.title }}</h3>
            <p class="mt-2 text-[#536273]">{{ s.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-6 py-16" aria-labelledby="features-heading">
      <h2 id="features-heading" class="text-center font-serif text-3xl font-semibold">Made for the day, kept for years</h2>
      <ul class="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="f in features" :key="f.title" class="panel">
          <h3 class="font-serif text-lg font-semibold">{{ f.title }}</h3>
          <p class="mt-2 text-sm text-[#536273]">{{ f.body }}</p>
        </li>
      </ul>
      <div class="mt-12 text-center">
        <NuxtLink class="btn" to="/auth/register">Get started</NuxtLink>
      </div>
    </section>
  </div>
</template>
