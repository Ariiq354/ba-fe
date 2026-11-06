<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useDocumentVisibility, useIntervalFn, useWindowFocus } from "#imports";
import { useApi } from "~/composables/fetch";
import { ANGSURAN_PENDING_KEY } from "~/features/angsuran/data";
import { PEMBIAYAAN_PENDING_KEY } from "~/features/pembiayaan/data";
import { PEMINDAHBUKUAN_PENDING_KEY } from "~/features/pemindahbukuan/data";
import { APPROVAL_SIMPANAN_PENDING_KEY } from "~/features/simpanan/data";
import { authClient, can } from "~/utils/auth";

const session = authClient.useSession();
const canViewApproval = computed(() =>
  can(session.value.data?.user.role, "approvalSimpanan", "view"),
);
const { data: pendingApproval, clear: clearPendingApproval } = useApi<{ total: number }>(
  "/api/v1/simpanan/mutasi/pending-count",
  {
    key: APPROVAL_SIMPANAN_PENDING_KEY,
    enabled: canViewApproval,
    watch: [canViewApproval],
  },
);
const pendingApprovalBadge = computed<NavigationMenuItem["badge"]>(() => {
  const total = pendingApproval.value?.total ?? 0;
  return total > 0 ? { label: String(total), color: "warning", variant: "subtle" } : undefined;
});

watch(canViewApproval, (allowed) => {
  if (!allowed) clearPendingApproval();
});

const canViewPemindahbukuanMutasi = computed(() =>
  can(session.value.data?.user.role, "approvalPemindahbukuan", "view"),
);
const { data: pendingPemindahbukuan, clear: clearPendingPemindahbukuan } = useApi<{
  total: number;
}>("/api/v1/pemindahbukuan/pending-count", {
  key: PEMINDAHBUKUAN_PENDING_KEY,
  enabled: canViewPemindahbukuanMutasi,
  watch: [canViewPemindahbukuanMutasi],
});
const pendingPemindahbukuanBadge = computed<NavigationMenuItem["badge"]>(() => {
  const total = pendingPemindahbukuan.value?.total ?? 0;
  return total > 0 ? { label: String(total), color: "warning", variant: "subtle" } : undefined;
});
watch(canViewPemindahbukuanMutasi, (allowed) => {
  if (!allowed) clearPendingPemindahbukuan();
});

const canViewPembiayaanApproval = computed(() =>
  can(session.value.data?.user.role, "approvalPembiayaan", "view"),
);
const { data: pendingPembiayaan, clear: clearPendingPembiayaan } = useApi<{ total: number }>(
  "/api/v1/pembiayaan/pending-count",
  {
    key: PEMBIAYAAN_PENDING_KEY,
    enabled: canViewPembiayaanApproval,
    watch: [canViewPembiayaanApproval],
  },
);
const pendingPembiayaanBadge = computed<NavigationMenuItem["badge"]>(() => {
  const total = pendingPembiayaan.value?.total ?? 0;
  return total > 0 ? { label: String(total), color: "warning", variant: "subtle" } : undefined;
});
watch(canViewPembiayaanApproval, (allowed) => {
  if (!allowed) clearPendingPembiayaan();
});

const canViewAngsuranApproval = computed(() =>
  can(session.value.data?.user.role, "approvalAngsuran", "view"),
);
const { data: pendingAngsuran, clear: clearPendingAngsuran } = useApi<{ total: number }>(
  "/api/v1/angsuran/pending-count",
  {
    key: ANGSURAN_PENDING_KEY,
    enabled: canViewAngsuranApproval,
    watch: [canViewAngsuranApproval],
  },
);
const pendingAngsuranBadge = computed<NavigationMenuItem["badge"]>(() => {
  const total = pendingAngsuran.value?.total ?? 0;
  return total > 0 ? { label: String(total), color: "warning", variant: "subtle" } : undefined;
});
watch(canViewAngsuranApproval, (allowed) => {
  if (!allowed) clearPendingAngsuran();
});

const documentVisibility = useDocumentVisibility();
const windowFocused = useWindowFocus();

function refreshPendingApprovals() {
  if (documentVisibility.value !== "visible") return;
  const keys = [
    ...(canViewApproval.value ? [APPROVAL_SIMPANAN_PENDING_KEY] : []),
    ...(canViewPemindahbukuanMutasi.value ? [PEMINDAHBUKUAN_PENDING_KEY] : []),
    ...(canViewPembiayaanApproval.value ? [PEMBIAYAAN_PENDING_KEY] : []),
    ...(canViewAngsuranApproval.value ? [ANGSURAN_PENDING_KEY] : []),
  ];
  if (keys.length) void refreshNuxtData(keys);
}

watch([windowFocused, documentVisibility], ([focused, visibility]) => {
  if (focused && visibility === "visible") refreshPendingApprovals();
});
useIntervalFn(refreshPendingApprovals, 60_000);

const masterItems = computed<NavigationMenuItem[]>(() => {
  const role = session.value.data?.user.role;
  return [
    ...(can(role, "masterAkun", "view")
      ? [{ label: "Master Akun", to: "/dashboard/master-akun", icon: "i-tabler-book-2" }]
      : []),
    ...(can(role, "masterMargin", "view")
      ? [{ label: "Master Margin", to: "/dashboard/master-margin", icon: "i-tabler-percentage" }]
      : []),
    ...(can(role, "masterSaham", "view")
      ? [{ label: "Master Saham", to: "/dashboard/master-saham", icon: "i-tabler-coins" }]
      : []),
  ];
});

const serviceItems = computed<NavigationMenuItem[]>(() => {
  const role = session.value.data?.user.role;
  return [
    ...(can(role, "simpananSaya", "view")
      ? [{ label: "Simpanan", to: "/dashboard/simpanan", icon: "i-tabler-wallet" }]
      : []),
    ...(can(role, "pemindahbukuan", "view")
      ? [{ label: "Pemindahbukuan", to: "/dashboard/pemindahbukuan", icon: "i-tabler-transfer" }]
      : []),
    ...(can(role, "pembiayaan", "view")
      ? [{ label: "Pembiayaan", to: "/dashboard/pembiayaan", icon: "i-tabler-file-invoice" }]
      : []),
    ...(can(role, "angsuran", "view")
      ? [{ label: "Angsuran", to: "/dashboard/angsuran", icon: "i-tabler-calendar-dollar" }]
      : []),
  ];
});

const managementItems = computed<NavigationMenuItem[]>(() => {
  const role = session.value.data?.user.role;
  return [
    ...(can(role, "mutasiSimpanan", "view")
      ? [
          {
            label: "Daftar Simpanan",
            to: "/dashboard/daftar-simpanan",
            icon: "i-tabler-list-details",
            badge: pendingApprovalBadge.value,
          },
        ]
      : []),
    ...(canViewPemindahbukuanMutasi.value
      ? [
          {
            label: "Daftar Pemindahbukuan",
            to: "/dashboard/daftar-pemindahbukuan",
            icon: "i-tabler-clipboard-check",
            badge: pendingPemindahbukuanBadge.value,
          },
        ]
      : []),
    ...(canViewPembiayaanApproval.value
      ? [
          {
            label: "Daftar Pembiayaan",
            to: "/dashboard/daftar-pembiayaan",
            icon: "i-tabler-files",
            badge: pendingPembiayaanBadge.value,
          },
        ]
      : []),
    ...(canViewAngsuranApproval.value
      ? [
          {
            label: "Daftar Angsuran",
            to: "/dashboard/daftar-angsuran",
            icon: "i-tabler-calendar-check",
            badge: pendingAngsuranBadge.value,
          },
        ]
      : []),
  ];
});

const monitoringItems = computed<NavigationMenuItem[]>(() => {
  if (session.value.data?.user.role !== "admin") return [];

  return [
    {
      label: "Monitoring Simpanan",
      to: "/dashboard/monitoring/simpanan",
      icon: "i-tabler-wallet",
    },
    {
      label: "Monitoring Pembiayaan",
      to: "/dashboard/monitoring/pembiayaan",
      icon: "i-tabler-file-invoice",
    },
    {
      label: "Monitoring SHU",
      to: "/dashboard/monitoring/shu",
      icon: "i-tabler-report-money",
    },
  ];
});

const accountingItems = computed<NavigationMenuItem[]>(() => {
  if (session.value.data?.user.role !== "admin") return [];

  return [
    { label: "Jurnal Transaksi", to: "/dashboard/jurnal", icon: "i-tabler-notebook" },
    { label: "Neraca", to: "/dashboard/neraca", icon: "i-tabler-scale" },
    { label: "Laba Rugi", to: "/dashboard/laba-rugi", icon: "i-tabler-chart-bar" },
  ];
});

const administrationItems = computed<NavigationMenuItem[]>(() => {
  const role = session.value.data?.user.role;
  return [
    ...(can(role, "pengguna", "view")
      ? [{ label: "Daftar Pengguna", to: "/dashboard/users", icon: "i-tabler-users" }]
      : []),
    ...masterItems.value,
  ];
});

const items = computed<NavigationMenuItem[][]>(() => [
  [
    { label: "Beranda", to: "/dashboard", icon: "i-tabler-layout-dashboard" },
    {
      label: "Bagi Hasil Usaha",
      to: "/dashboard/bagi-hasil-usaha",
      icon: "i-tabler-report-money",
    },
  ],
  ...(serviceItems.value.length
    ? [[{ label: "Layanan", type: "label" as const }, ...serviceItems.value]]
    : []),
  ...(managementItems.value.length
    ? [[{ label: "Pengelolaan", type: "label" as const }, ...managementItems.value]]
    : []),
  ...(monitoringItems.value.length
    ? [[{ label: "Monitoring", type: "label" as const }, ...monitoringItems.value]]
    : []),
  ...(accountingItems.value.length
    ? [[{ label: "Akuntansi", type: "label" as const }, ...accountingItems.value]]
    : []),
  ...(administrationItems.value.length
    ? [[{ label: "Administrasi", type: "label" as const }, ...administrationItems.value]]
    : []),
]);
</script>

<template>
  <UNavigationMenu orientation="vertical" :items="items" />
</template>
