export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: true,

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
      title: 'ranzaGG - Free GeoGuessr Alternative Powered by Mapillary',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Play ranzaGG, a 100% free and ad-free GeoGuessr alternative powered by Mapillary. Explore the world in singleplayer or multiplayer modes, try different game modes, and guess your location!'
        },
        {
          name: 'keywords',
          content:
            'geoguessr alternative, free geography game, ad-free, multiplayer geography, mapillary game, mapillary geoguessr, world map, guess the location, singleplayer, geography trivia, ranzaGG'
        },
        { name: 'theme-color', content: '#0f172a' },
        { name: 'robots', content: 'index, follow' },
        { property: 'og:site_name', content: 'ranzaGG' },
        {
          property: 'og:title',
          content: 'ranzaGG - Free GeoGuessr Alternative Powered by Mapillary'
        },
        {
          property: 'og:description',
          content:
            'Play a 100% free and ad-free GeoGuessr alternative powered by Mapillary. Drop into random locations solo or with friends and guess where you are!'
        },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og-image.png' },
        { name: 'twitter:card', content: 'summary_large_image' },
        {
          name: 'twitter:title',
          content: 'ranzaGG - Free GeoGuessr Alternative Powered by Mapillary'
        },
        {
          name: 'twitter:description',
          content:
            'Play a 100% free and ad-free GeoGuessr alternative powered by Mapillary. Explore the world and guess your location!'
        },
        { name: 'twitter:image', content: '/og-image.png' }
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
        files: ['features/game/en.json', 'features/error/en.json']
      },
      {
        code: 'hu',
        name: 'Magyar',
        files: ['features/game/hu.json', 'features/error/hu.json']
      }
    ]
  },

  vite: {
    optimizeDeps: {
      include: ['socket.io-client', 'mapillary-js', 'leaflet']
    }
  }
});
