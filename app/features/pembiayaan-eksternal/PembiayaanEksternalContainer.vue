<script setup lang="ts">
import type { PembiayaanEksternalResponse, StatusPelunasan } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { PAGE_SIZE } from "~/constants";
import { JURNAL_LIST_KEY } from "~/features/jurnal/data";
import { authClient } from "~/utils/auth";
import ModalTambahPembiayaanEksternal from "./components/ModalTambahPembiayaanEksternal.vue";
import { PEMBIAYAAN_EKSTERNAL_LIST_KEY, PEMBIAYAAN_EKSTERNAL_OPTIONS_KEY } from "./data";
import { pembiayaanEksternalColumns, statusPelunasanLabels, statusPelunasanOptions } from "./model";

const session = authClient.useSession();
const isAdmin = computed(() => session.value.data?.user.role === "admin");
const page = ref(1);
const search = ref("");
const statusFilter = ref<"all" | StatusPelunasan>("all");
const limit = PAGE_SIZE;
watch(
  [search, statusFilter],
  () => {
    page.value = 1;
  },
  { flush: "sync" },
);

const { data, status, error, refresh } = useApi<PembiayaanEksternalResponse>(
  "/api/v1/pembiayaan-eksternal",
  {
    key: PEMBIAYAAN_EKSTERNAL_LIST_KEY,
    query: { page, limit, search, statusPelunasan: statusFilter },
    enabled: isAdmin,
    watch: [isAdmin],
  },
);
const total = computed(() => data.value?.total ?? 0);
const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });

async function refreshAfterChange() {
  await Promise.all([
    refreshList(),
    refreshNuxtData([PEMBIAYAAN_EKSTERNAL_OPTIONS_KEY, JURNAL_LIST_KEY]),
  ]);
}
function openForm() {
  if (!isAdmin.value) return;
  openModal(ModalTambahPembiayaanEksternal, { refresh: refreshAfterChange });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-semibold text-highlighted">Pembiayaan Eksternal</h1>
      <UButton v-if="isAdmin" icon="i-tabler-plus" class="justify-center" @click="openForm">
        Tambah Pembiayaan
      </UButton>
    </div>
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row">
          <InputSearch
            v-model="search"
            placeholder="Cari kode atau tujuan..."
            aria-label="Cari pembiayaan eksternal"
          />
          <USelect
            v-model="statusFilter"
            :items="statusPelunasanOptions"
            aria-label="Filter pelunasan"
            class="w-full sm:w-48"
          />
        </div>
        <UAlert
          v-if="error"
          title="Gagal Memuat Pembiayaan"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: refreshList }]"
        />
        <DataTable
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :columns="pembiayaanEksternalColumns"
          :loading="status === 'pending'"
          :total="total"
          enumerate
          pagination
        >
          <template #statusPelunasan-cell="{ row }">
            <UBadge
              :color="statusPelunasanLabels[row.original.statusPelunasan as StatusPelunasan].color"
              variant="subtle"
            >
              {{ statusPelunasanLabels[row.original.statusPelunasan as StatusPelunasan].label }}
            </UBadge>
          </template>
          <template #tujuan-cell="{ row }">
            <p class="max-w-xs whitespace-normal">{{ row.original.tujuan }}</p>
          </template>
          <template #empty>
            <p class="py-8 text-center text-muted">Tidak ada pembiayaan eksternal</p>
          </template>
        </DataTable>
      </div>
    </UCard>
  </div>
</template>
