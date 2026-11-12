<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Pemindahbukuan, PemindahbukuanResponse, TipePemindahbukuan } from "./model";
import type { AnggotaOptionsResponse, StatusMutasi } from "~/features/simpanan/model";
import InputSearch from "~/components/input/InputSearch.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { PAGE_SIZE } from "~/constants";
import { getAnggotaOptions, statusMutasiOptions } from "~/features/simpanan/model";
import ModalDetailPemindahbukuan from "./components/ModalDetailPemindahbukuan.vue";
import ModalProsesPemindahbukuan from "./components/ModalProsesPemindahbukuan.vue";
import TabelPemindahbukuan from "./components/TabelPemindahbukuan.vue";
import { PEMINDAHBUKUAN_MUTASI_LIST_KEY, refreshPemindahbukuanData } from "./data";
import { tipePemindahbukuanOptions } from "./model";

const page = ref(1);
const search = ref("");
const statusFilter = ref<"all" | StatusMutasi>("all");
const tipe = ref<"all" | TipePemindahbukuan>("all");
const selectedUserId = ref<number | "all">("all");
const targetUserId = computed(() =>
  selectedUserId.value === "all" ? undefined : selectedUserId.value,
);
const limit = PAGE_SIZE;

watch(
  [search, statusFilter, tipe, targetUserId],
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
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options");
const memberOptions = computed(() => [
  { label: "Semua anggota", value: "all" },
  ...getAnggotaOptions(members.value?.data ?? []),
]);
const tipeOptions = [{ label: "Semua jenis", value: "all" }, ...tipePemindahbukuanOptions];
const { data, status, error, refresh } = useApi<PemindahbukuanResponse>("/api/v1/pemindahbukuan", {
  key: PEMINDAHBUKUAN_MUTASI_LIST_KEY,
  query: {
    page,
    limit,
    search,
    status: statusFilter,
    tipePemindahbukuan: tipe,
    userId: targetUserId,
  },
});
const total = computed(() => data.value?.total ?? 0);

const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });

function refreshAfterChange(userIds: number[]) {
  return refreshPemindahbukuanData(userIds, refreshList);
}

function viewTransfer(transfer: Pemindahbukuan) {
  openModal(ModalDetailPemindahbukuan, { transfer });
}

function processTransfer(transfer: Pemindahbukuan, action: "approve" | "reject") {
  if (status.value === "pending" || transfer.statusApproved !== "pending") return;
  openModal(ModalProsesPemindahbukuan, { transfer, action, refresh: refreshAfterChange });
}

function getDropdownItems(transfer: Pemindahbukuan): DropdownMenuItem[] {
  if (transfer.statusApproved !== "pending") return [];
  return [
    {
      label: "Setujui",
      icon: "i-tabler-check",
      onSelect: () => processTransfer(transfer, "approve"),
    },
    {
      label: "Tolak",
      icon: "i-tabler-x",
      color: "error",
      onSelect: () => processTransfer(transfer, "reject"),
    },
  ];
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">Daftar Pemindahbukuan</h1>
      <p class="mt-1 text-sm text-muted">
        Lihat semua mutasi pemindahbukuan dan tinjau pengajuan yang menunggu persetujuan untuk
        disetujui atau ditolak.
      </p>
    </div>
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <InputSearch
            v-model="search"
            placeholder="Cari kode transaksi..."
            aria-label="Cari mutasi pemindahbukuan"
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
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <USelect
            v-model="statusFilter"
            :items="statusMutasiOptions"
            aria-label="Filter status pemindahbukuan"
            class="w-full"
          />
          <USelect
            v-model="tipe"
            :items="tipeOptions"
            aria-label="Filter jenis pemindahbukuan"
            class="w-full"
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
          title="Gagal Memuat Mutasi Pemindahbukuan"
          description="Data transaksi belum dapat dimuat. Silakan coba lagi."
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: refreshList }]"
        />
        <TabelPemindahbukuan
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :loading="status === 'pending'"
          :total="total"
          :dropdown-items="getDropdownItems"
          empty-title="Tidak ada mutasi pemindahbukuan"
          empty-description="Coba kata kunci atau filter lain untuk melihat transaksi."
          @view="viewTransfer"
        />
      </div>
    </UCard>
  </div>
</template>
