<script setup lang="ts">
import type { AngsuranEksternalResponse } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { PAGE_SIZE } from "~/constants";
import { JURNAL_LIST_KEY } from "~/features/jurnal/data";
import {
  PEMBIAYAAN_EKSTERNAL_LIST_KEY,
  PEMBIAYAAN_EKSTERNAL_OPTIONS_KEY,
} from "~/features/pembiayaan-eksternal/data";
import ModalTambahAngsuranEksternal from "./components/ModalTambahAngsuranEksternal.vue";
import { ANGSURAN_EKSTERNAL_LIST_KEY } from "./data";
import { angsuranEksternalColumns } from "./model";

const page = ref(1);
const search = ref("");
const limit = PAGE_SIZE;
watch(
  search,
  () => {
    page.value = 1;
  },
  { flush: "sync" },
);

const { data, status, error, refresh } = useApi<AngsuranEksternalResponse>(
  "/api/v1/angsuran-eksternal",
  {
    key: ANGSURAN_EKSTERNAL_LIST_KEY,
    query: { page, limit, search },
  },
);
const total = computed(() => data.value?.total ?? 0);
const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });

async function refreshAfterChange() {
  await Promise.all([
    refreshList(),
    refreshNuxtData([
      PEMBIAYAAN_EKSTERNAL_LIST_KEY,
      PEMBIAYAAN_EKSTERNAL_OPTIONS_KEY,
      JURNAL_LIST_KEY,
    ]),
  ]);
}
function openForm() {
  openModal(ModalTambahAngsuranEksternal, { refresh: refreshAfterChange });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-semibold text-highlighted">Angsuran Eksternal</h1>
      <UButton icon="i-tabler-plus" class="justify-center" @click="openForm">
        Tambah Angsuran
      </UButton>
    </div>
    <UCard>
      <div class="space-y-4">
        <InputSearch
          v-model="search"
          placeholder="Cari kode angsuran atau pembiayaan..."
          aria-label="Cari angsuran eksternal"
        />
        <UAlert
          v-if="error"
          title="Gagal Memuat Angsuran"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: refreshList }]"
        />
        <DataTable
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :columns="angsuranEksternalColumns"
          :loading="status === 'pending'"
          :total="total"
          enumerate
          pagination
        >
          <template #keterangan-cell="{ row }">
            <p class="max-w-xs whitespace-normal">{{ row.original.keterangan || "—" }}</p>
          </template>
          <template #empty>
            <p class="py-8 text-center text-muted">Tidak ada angsuran eksternal</p>
          </template>
        </DataTable>
      </div>
    </UCard>
  </div>
</template>
