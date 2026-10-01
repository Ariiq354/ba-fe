<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { MutasiResponse } from "~/features/simpanan/model";
import { useDocumentVisibility, useIntervalFn, useWindowFocus } from "#imports";
import { useApi } from "~/composables/fetch";
import { APPROVAL_SIMPANAN_PENDING_KEY } from "~/features/simpanan/keys";
import { authClient, can } from "~/utils/auth";

const session = authClient.useSession();
const canViewApproval = computed(() => can(session.value.data?.user.role, "approvalSimpanan", "view"));
const { data: pendingApproval, clear: clearPendingApproval } = useApi<MutasiResponse>("/api/v1/simpanan/mutasi", {
  key: APPROVAL_SIMPANAN_PENDING_KEY,
  query: { status: "pending", page: 1, limit: 1 },
  pick: ["total"],
  enabled: canViewApproval,
  watch: [canViewApproval],
});
const pendingApprovalBadge = computed<NavigationMenuItem["badge"]>(() => {
  const total = pendingApproval.value?.total ?? 0;
  return total > 0 ? { label: String(total), color: "warning", variant: "subtle" } : undefined;
});

watch(canViewApproval, (allowed) => {
  if (!allowed)
    clearPendingApproval();
});

const documentVisibility = useDocumentVisibility();
const windowFocused = useWindowFocus();

function refreshPendingApproval() {
  if (canViewApproval.value && documentVisibility.value === "visible")
    void refreshNuxtData(APPROVAL_SIMPANAN_PENDING_KEY);
}

watch([windowFocused, documentVisibility], ([focused, visibility]) => {
  if (focused && visibility === "visible")
    refreshPendingApproval();
});
useIntervalFn(refreshPendingApproval, 60_000);

const masterItems = computed<NavigationMenuItem[]>(() => {
  const role = session.value.data?.user.role;
  return [
    ...(can(role, "masterAkun", "view") ? [{ label: "Master Akun", to: "/dashboard/master-akun", icon: "i-tabler-book-2" }] : []),
    ...(can(role, "masterMargin", "view") ? [{ label: "Master Margin", to: "/dashboard/master-margin", icon: "i-tabler-percentage" }] : []),
    ...(can(role, "masterSaham", "view") ? [{ label: "Master Saham", to: "/dashboard/master-saham", icon: "i-tabler-chart-candle" }] : []),
  ];
});

const transactionItems = computed<NavigationMenuItem[]>(() => {
  const role = session.value.data?.user.role;
  return [
    ...(can(role, "inputSimpanan", "view") ? [{ label: "Input Simpanan Anggota", to: "/dashboard/input-simpanan", icon: "i-tabler-wallet" }] : []),
    ...(can(role, "mutasiSimpanan", "view") ? [{ label: "Mutasi Simpanan", to: "/dashboard/mutasi-simpanan", icon: "i-tabler-arrows-exchange" }] : []),
    ...(canViewApproval.value ? [{ label: "Approval Simpanan", to: "/dashboard/approval-simpanan", icon: "i-tabler-checks", badge: pendingApprovalBadge.value }] : []),
    ...(can(role, "jurnal", "view") ? [{ label: "Jurnal Transaksi", to: "/dashboard/jurnal", icon: "i-tabler-receipt-2" }] : []),
  ];
});

const items = computed<NavigationMenuItem[][]>(() => [
  [
    { label: "Dashboard", type: "label" },
    { label: "Beranda", to: "/dashboard", icon: "i-tabler-layout-dashboard" },
    ...(can(session.value.data?.user.role, "simpananSaya", "view") ? [{ label: "Simpanan Saya", to: "/dashboard/simpanan", icon: "i-tabler-wallet" }] : []),
    // { label: "Pembiayaan Saya", to: "/dashboard/pembiayaan", icon: "i-tabler-file-text" },
    // { label: "Bagi Hasil Usaha", to: "/dashboard/shu", icon: "i-tabler-coins" },
  ],
  ...(masterItems.value.length
    ? [[
        { label: "Master Data", type: "label" as const },
        ...masterItems.value,
      ]]
    : []),
  ...(transactionItems.value.length
    ? [[
        { label: "Transaksi", type: "label" as const },
        ...transactionItems.value,
      ]]
    : []),
  ...(can(session.value.data?.user.role, "pengguna", "view")
    ? [[
        { label: "Keanggotaan", type: "label" as const },
        { label: "Daftar Pengguna", to: "/dashboard/users", icon: "i-tabler-users" },
      ]]
    : []),
]);
</script>

<template>
  <UNavigationMenu
    orientation="vertical"
    :items="items"
  />
</template>
