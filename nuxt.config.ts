// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      mapillaryClientToken: process.env.MAPILLARY_CLIENT_TOKEN || ''
    }
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/hints',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxtjs/i18n',
    '@pinia/nuxt'
  ],

  i18n: {
    defaultLocale: 'en',
    langDir: 'locales/',
    locales: [
      {
        code: 'en',
        name: 'English',
        file: 'features/game/en.json'
      },
      {
        code: 'hu',
        name: 'Magyar',
        file: 'features/game/hu.json'
      }
    ],
  },

  vite: {
    optimizeDeps: {
      include: ['socket.io-client']
    }
  }
})