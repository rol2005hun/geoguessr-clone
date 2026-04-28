export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
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

  app: {
    head: {
      title: 'ranzaGG',
      meta: [
        { name: 'description', content: 'A GeoGuessr clone built with Nuxt 3' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/logo.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
        }
      ]
    }
  },

  i18n: {
    restructureDir: 'app',
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
    ]
  },

  vite: {
    optimizeDeps: {
      include: [
        'socket.io-client',
        'mapillary-js',
        'leaflet',
        '@vue/devtools-core',
        '@vue/devtools-kit'
      ]
    }
  }
});
