export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  supabase: { redirect: false },
  runtimeConfig: { public: { siteName: 'EventKeepsakes' } },
  app: {
    head: {
      htmlAttrs: { lang: 'en-AU' },
      title: 'EventKeepsakes',
      titleTemplate: (t?: string) => (t && t !== 'EventKeepsakes' ? `${t} · EventKeepsakes` : 'EventKeepsakes'),
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Collect every guest’s photos and videos in one place.' },
        { name: 'theme-color', content: '#F8F4EB' },
        { property: 'og:site_name', content: 'EventKeepsakes' },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'EventKeepsakes — Capture · Share · Remember' },
        { property: 'og:description', content: 'Give every guest one QR code to share their photos and videos from your event.' },
        { property: 'og:image', content: '/branding/eventkeepsakes-logo.png' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/branding/eventkeepsakes-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap' }
      ]
    }
  },
  nitro: { preset: 'netlify' }
})
