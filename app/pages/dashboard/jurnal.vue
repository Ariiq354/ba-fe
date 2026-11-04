<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

definePageMeta({
  layout: {
    name: "dashboard",
  },
});

useHead({
  title: "Jurnal Transaksi · Berkah Amanah",
});

const session = authClient.useSession();
const links = computed<NavigationMenuItem[]>(() => [
  {
    label: "Input Transaksi",
    icon: "i-tabler-receipt-2",
    to: "/dashboard/jurnal/input-transaksi",
  },
  {
    label: "Input Manual",
    icon: "i-tabler-pencil",
    to: "/dashboard/jurnal/input-manual",
  },
  ...(session.value.data?.user.role === "admin"
    ? [
        {
          label: "Master Input",
          icon: "i-tabler-settings",
          to: "/dashboard/jurnal/master-input",
        },
      ]
    : []),
]);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Jurnal Transaksi">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight class="-mx-1 min-w-0 flex-1" />
      </UDashboardToolbar>
    </template>
    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
