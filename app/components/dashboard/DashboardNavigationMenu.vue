<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import type { PemindahbukuanResponse } from "~/features/pemindahbukuan/model";
import type { MutasiResponse } from "~/features/simpanan/model";
import { useDocumentVisibility, useIntervalFn, useWindowFocus } from "#imports";
import { useApi } from "~/composables/fetch";
import { PEMINDAHBUKUAN_PENDING_KEY } from "~/features/pemindahbukuan/data";
import { APPROVAL_SIMPANAN_PENDING_KEY } from "~/features/simpanan/data";
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

const canViewPemindahbukuanApproval = computed(() => can(session.value.data?.user.role, "approvalPemindahbukuan", "view"));
const { data: pendingPemindahbukuan, clear: clearPendingPemindahbukuan } = useApi<PemindahbukuanResponse>("/api/v1/pemindahbukuan", {
  key: PEMINDAHBUKUAN_PENDING_KEY,
  query: { status: "pending", page: 1, limit: 1 },
  pick: ["total"],
  enabled: canViewPemindahbukuanApproval,
  watch: [canViewPemindahbukuanApproval],
});
const pendingPemindahbukuanBadge = computed<NavigationMenuItem["badge"]>(() => {
  const total = pendingPemindahbukuan.value?.total ?? 0;
  return total > 0 ? { label: String(total), color: "warning", variant: "subtle" } : undefined;
});
watch(canViewPemindahbukuanApproval, (allowed) => {
  if (!allowed)
    clearPendingPemindahbukuan();
});

const documentVisibility = useDocumentVisibility();
const windowFocused = useWindowFocus();

function refreshPendingApprovals() {
  if (documentVisibility.value !== "visible")
    return;
  const keys = [
    ...(canViewApproval.value ? [APPROVAL_SIMPANAN_PENDING_KEY] : []),
    ...(canViewPemindahbukuanApproval.value ? [PEMINDAHBUKUAN_PENDING_KEY] : []),
  ];
  if (keys.length)
    void refreshNuxtData(keys);
}

watch([windowFocused, documentVisibility], ([focused, visibility]) => {
  if (focused && visibility === "visible")
    refreshPendingApprovals();
});
useIntervalFn(refreshPendingApprovals, 60_000);

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
    ...(can(role, "pemindahbukuan", "view") ? [{ label: "Pemindahbukuan", to: "/dashboard/pemindahbukuan", icon: "i-tabler-transfer" }] : []),
    ...(canViewPemindahbukuanApproval.value ? [{ label: "Approval Pemindahbukuan", to: "/dashboard/approval-pemindahbukuan", icon: "i-tabler-checks", badge: pendingPemindahbukuanBadge.value }] : []),
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
