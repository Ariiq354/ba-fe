// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  ssr: false,
  spaLoadingTemplate: true,

  nitro: {
    preset: "static",
  },

  modules: ["nuxt-security", "@nuxt/ui", "@nuxt/image", "@vueuse/nuxt"],

  css: ["~/assets/css/main.css"],

  image: {
    provider: "none",
  },

  ui: {
    colorMode: false,
  },

  imports: {
    scan: false,
  },

  components: {
    dirs: [],
  },

  security: {
    sri: false,
    headers: {
      crossOriginResourcePolicy: "same-site",
      contentSecurityPolicy: {
        "img-src": ["'self'", "data:", "blob:", "https://assets.ubberkahamanah.my.id"],
      },
    },
  },

  icon: {
    clientBundle: {
      scan: {
        globInclude: ["**/*.{vue,jsx,tsx,md,mdc,mdx,yml,yaml,ts,js}"],
      },
    },
  },
});
