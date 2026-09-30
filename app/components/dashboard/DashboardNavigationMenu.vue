<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { authClient, can } from "~/utils/auth";

const session = authClient.useSession();

const masterItems = computed<NavigationMenuItem[]>(() => {
  const role = session.value.data?.user.role;
  return [
    ...(can(role, "masterAkun", "view") ? [{ label: "Master Akun", to: "/dashboard/master-akun", icon: "i-tabler-book-2" }] : []),
    ...(can(role, "masterMargin", "view") ? [{ label: "Master Margin", to: "/dashboard/master-margin", icon: "i-tabler-percentage" }] : []),
    ...(can(role, "masterSaham", "view") ? [{ label: "Master Saham", to: "/dashboard/master-saham", icon: "i-tabler-chart-candle" }] : []),
  ];
});

const items = computed<NavigationMenuItem[][]>(() => [
  [
    { label: "Dashboard", type: "label" },
    { label: "Beranda", to: "/dashboard", icon: "i-tabler-layout-dashboard" },
    // { label: "Simpanan Saya", to: "/dashboard/simpanan", icon: "i-tabler-wallet" },
    // { label: "Pembiayaan Saya", to: "/dashboard/pembiayaan", icon: "i-tabler-file-text" },
    // { label: "Bagi Hasil Usaha", to: "/dashboard/shu", icon: "i-tabler-coins" },
  ],
  ...(masterItems.value.length
    ? [[
        { label: "Master Data", type: "label" as const },
        ...masterItems.value,
      ]]
    : []),
  ...(can(session.value.data?.user.role, "jurnal", "view")
    ? [[
        { label: "Transaksi", type: "label" as const },
        { label: "Jurnal Transaksi", to: "/dashboard/jurnal", icon: "i-tabler-receipt-2" },
      ]]
    : []),
  ...(can(session.value.data?.user.role, "pengguna", "view")
    ? [[
        { label: "Keanggotaan", type: "label" as const },
        { label: "Daftar Pengguna", to: "/dashboard/users", icon: "i-tabler-users" },
      ]]
    : []),
  // [
  //   { label: "Master Data", type: "label" },
  //   { label: "Approval Simpanan", to: "/dashboard/approval-simpanan", icon: "i-tabler-checks" },
  // ],
]);
</script>

<template>
  <UNavigationMenu
    orientation="vertical"
    :items="items"
  />
</template>
