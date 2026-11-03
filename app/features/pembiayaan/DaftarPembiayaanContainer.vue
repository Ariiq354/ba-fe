<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Pembiayaan, PembiayaanAction, PembiayaanResponse } from "./model";
import type { AnggotaOptionsResponse, StatusMutasi } from "~/features/simpanan/model";
import InputSearch from "~/components/input/InputSearch.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { getAnggotaOptions, statusMutasiOptions } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import ModalDetailPembiayaan from "./components/ModalDetailPembiayaan.vue";
import ModalProsesPembiayaan from "./components/ModalProsesPembiayaan.vue";
import TabelPembiayaan from "./components/TabelPembiayaan.vue";
import { PEMBIAYAAN_APPROVAL_LIST_KEY } from "./data";
import { canProcessPembiayaan } from "./model";

const session = authClient.useSession();
const canView = computed(() => can(session.value.data?.user.role, "approvalPembiayaan", "view"));
const canApprove = computed(() =>
  can(session.value.data?.user.role, "approvalPembiayaan", "manage"),
);
const page = ref(1);
const search = ref("");
const statusFilter = ref<"all" | StatusMutasi>("all");
const selectedUserId = ref<number | "all">("all");
const targetUserId = computed(() =>
  selectedUserId.value === "all" ? undefined : selectedUserId.value,
);
const limit = 10;
watch(
  [search, statusFilter, targetUserId],
  () => {
    page.value = 1;
  },
  { flush: "sync" },
);

const {
  data: members,
  status: membersStatus,
  error: membersError,
  refresh: refreshMembers,
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canView,
  watch: [canView],
});
const memberOptions = computed(() => [
  { label: "Semua anggota", value: "all" },
  ...getAnggotaOptions(members.value?.data ?? []),
]);
const { data, status, error, refresh } = useApi<PembiayaanResponse>("/api/v1/pembiayaan", {
  key: PEMBIAYAAN_APPROVAL_LIST_KEY,
  query: {
    page,
    limit,
    search,
    status: statusFilter,
    userId: targetUserId,
  },
  enabled: canView,
  watch: [canView],
});
const total = computed(() => data.value?.total ?? 0);
const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });

function viewPembiayaan(item: Pembiayaan) {
  openModal(ModalDetailPembiayaan, { pembiayaan: item });
}
function processPembiayaan(item: Pembiayaan, action: Exclude<PembiayaanAction, "cancel">) {
  if (status.value === "pending" || !canApprove.value || !canProcessPembiayaan(item, action))
    return;
  openModal(ModalProsesPembiayaan, { pembiayaan: item, action, refresh: refreshList });
}
function getDropdownItems(item: Pembiayaan): DropdownMenuItem[] {
  if (item.statusApproved !== "pending" || status.value === "pending" || !canApprove.value)
    return [];
  const items: DropdownMenuItem[] = [];
  if (canProcessPembiayaan(item, "transfer"))
    items.push({
      label: "Transfer",
      icon: "i-tabler-cash-banknote",
      onSelect: () => processPembiayaan(item, "transfer"),
    });
  if (canProcessPembiayaan(item, "approve"))
    items.push({
      label: "Setujui",
      icon: "i-tabler-check",
      onSelect: () => processPembiayaan(item, "approve"),
    });
  if (canProcessPembiayaan(item, "reject"))
    items.push({
      label: "Tolak",
      icon: "i-tabler-x",
      color: "error",
      onSelect: () => processPembiayaan(item, "reject"),
    });
  return items;
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">Daftar Pembiayaan</h1>
      <p class="mt-1 text-sm text-muted">
        Tinjau pengajuan pembiayaan untuk disetujui atau ditolak.
      </p>
    </div>
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
          <InputSearch
            v-model="search"
            placeholder="Cari kode transaksi..."
            aria-label="Cari pembiayaan"
          />
          <USelectMenu
            v-model="selectedUserId"
            :items="memberOptions"
            value-key="value"
            :loading="membersStatus === 'pending'"
            :disabled="membersStatus !== 'success'"
            aria-label="Filter anggota"
            class="w-full lg:w-80"
          />
          <USelect
            v-model="statusFilter"
            :items="statusMutasiOptions"
            aria-label="Filter status pembiayaan"
            class="w-full lg:w-48"
          />
        </div>
        <UAlert
          v-if="membersError"
          title="Gagal Memuat Pilihan Anggota"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]"
        />
        <UAlert
          v-if="error"
          title="Gagal Memuat Pembiayaan"
          description="Data belum dapat dimuat. Silakan coba lagi."
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: refreshList }]"
        />
        <TabelPembiayaan
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :loading="status === 'pending'"
          :total="total"
          :dropdown-items="getDropdownItems"
          @view="viewPembiayaan"
        />
      </div>
    </UCard>
  </div>
</template>
