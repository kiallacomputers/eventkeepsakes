export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  supabase: { redirect: false },
  runtimeConfig: { public: { siteName: 'EventKeepsakes' } },
  app: { head: { title: 'EventKeepsakes', meta: [{ name: 'description', content: 'Collect every guest’s photos and videos in one place.' }] } },
  nitro: { preset: 'netlify' }
})
