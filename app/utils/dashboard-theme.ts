import type { ThemeProps } from "@nuxt/ui/components/Theme.vue";

// Scoped above UApp so overlays share these defaults without changing auth pages.
export const dashboardTheme = {
  button: { size: "md", ui: { base: "min-h-10 sm:min-h-8" } },
  input: { size: "md", ui: { base: "min-h-10 text-base sm:min-h-8 sm:text-sm" } },
  inputNumber: {
    size: "md",
    ui: { base: "min-h-10 text-right text-base tabular-nums sm:min-h-8 sm:text-sm" },
  },
  textarea: { size: "md", ui: { base: "text-base sm:text-sm" } },
  select: { size: "md", ui: { base: "min-h-10 text-base sm:min-h-8 sm:text-sm" } },
  selectMenu: { size: "md", ui: { base: "min-h-10 text-base sm:min-h-8 sm:text-sm" } },
  formField: { size: "md" },
  navigationMenu: { ui: { linkLabel: "whitespace-normal" } },
  card: {
    ui: {
      root: "rounded-lg shadow-none",
      body: "p-4 sm:p-5",
    },
  },
  table: {
    ui: {
      th: "px-3 py-3 text-xs font-medium text-muted",
      td: "px-3 py-3 text-sm text-highlighted",
    },
  },
  modal: {
    class: "dashboard-modal",
    ui: {
      content: "rounded-lg shadow-xl",
      header: "min-h-0 items-start px-5 py-4 sm:px-6",
      title: "text-base font-semibold text-highlighted",
      description: "text-sm leading-relaxed text-muted",
      body: "p-5 sm:p-6",
      footer: "justify-end gap-2 bg-muted/40 px-5 py-4 sm:px-6",
      overlay: "bg-neutral-950/35 motion-reduce:animate-none",
    },
  },
  dashboardPanel: {
    ui: { body: "gap-5 bg-[#f5f7f9] p-4 sm:p-6 lg:p-8" },
  },
} satisfies NonNullable<ThemeProps["props"]>;
