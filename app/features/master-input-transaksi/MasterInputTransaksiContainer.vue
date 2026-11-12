<script setup lang="ts">
import type { MasterInputTransaksi, MasterInputTransaksiResponse, StatusFilter } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import ModalConfirmDelete from "~/components/modal/ModalConfirmDelete.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { API_URL, PAGE_SIZE } from "~/constants";
import ModalMasterInputTransaksi from "./components/ModalMasterInputTransaksi.vue";
import { masterInputTransaksiColumns, statusFilterOptions } from "./model";

const page = ref(1);
const search = ref("");
const statusFilter = ref<StatusFilter>("all");
const limit = PAGE_SIZE;

watch(
  [search, statusFilter],
  () => {
    page.value = 1;
  },
  { flush: "sync" },
);

const query = computed(() => ({
  page: page.value,
  limit,
  search: search.value,
  ...(statusFilter.value === "all" ? {} : { isActive: statusFilter.value === "active" }),
}));
const { data, status, error, refresh } = useApi<MasterInputTransaksiResponse>(
  "/api/v1/master-input-transaksi",
  { query },
);
const total = computed(() => data.value?.total ?? 0);
const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });
const isFiltered = computed(() => !!search.value || statusFilter.value !== "all");

function openForm(template?: MasterInputTransaksi) {
  openModal(ModalMasterInputTransaksi, { template, refresh: refreshList });
}

function deleteTemplates(ids: number[]) {
  openModal(ModalConfirmDelete, {
    title: "Hapus Master Input",
    description: `Hapus ${ids.length} master input yang dipilih?`,
    path: `${API_URL}/api/v1/master-input-transaksi`,
    body: { ids },
    refresh: refreshList,
  });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Master Input</h1>
        <p class="mt-1 text-sm text-muted">
          Kelola template transaksi dan pasangan akun debit–kredit.
        </p>
      </div>
      <UButton icon="i-tabler-plus" class="justify-center" @click="openForm()">
        Tambah Master Input
      </UButton>
    </div>

    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row">
          <InputSearch v-model="search" placeholder="Cari nama..." aria-label="Cari master input" />
          <USelect
            v-model="statusFilter"
            :items="statusFilterOptions"
            aria-label="Filter status master input"
            class="w-full sm:w-48"
          />
        </div>

        <UAlert
          v-if="error"
          title="Gagal Memuat Master Input"
          description="Silakan coba lagi."
          color="error"
          variant="subtle"
          icon="i-tabler-alert-circle"
          :actions="[
            { label: 'Coba lagi', color: 'error', variant: 'outline', onClick: refreshList },
          ]"
        />
        <DataTable
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :columns="masterInputTransaksiColumns"
          :loading="status === 'pending'"
          :total="total"
          selectable
          editable
          deletable
          enumerate
          pagination
          @edit="openForm"
          @delete="deleteTemplates"
        >
          <template #namaAkunDebit-cell="{ row }">
            <span class="font-mono">{{ row.original.kodeAkunDebit }}</span>
            · {{ row.original.namaAkunDebit }}
          </template>
          <template #namaAkunKredit-cell="{ row }">
            <span class="font-mono">{{ row.original.kodeAkunKredit }}</span>
            · {{ row.original.namaAkunKredit }}
          </template>
          <template #isActive-cell="{ row }">
            <UBadge :color="row.original.isActive ? 'success' : 'neutral'" variant="subtle">
              {{ row.original.isActive ? "Aktif" : "Nonaktif" }}
            </UBadge>
          </template>
          <template #empty>
            <p class="py-8 text-center text-muted">
              {{ isFiltered ? "Tidak ada master input yang sesuai" : "Belum ada master input" }}
            </p>
          </template>
        </DataTable>
      </div>
    </UCard>
  </div>
</template>
