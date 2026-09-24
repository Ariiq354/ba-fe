// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  ssr: false,
  spaLoadingTemplate: true,

  modules: [
    "@nuxt/eslint",
    "nuxt-security",
    "@nuxt/ui",
    "@nuxt/image",
    "nuxt-charts",
    "@vueuse/nuxt",
  ],

  css: ["~/assets/css/main.css"],

  eslint: {
    config: {
      standalone: false,
    },
  },

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
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://pub-d903c762cae0445d8dce45d854b69f88.r2.dev",
        ],
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
