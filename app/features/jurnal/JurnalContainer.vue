<script setup lang="ts">
import type { JurnalResponse, JurnalSummary } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import ModalConfirmDelete from "~/components/modal/ModalConfirmDelete.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import ModalDetailJurnal from "./components/ModalDetailJurnal.vue";
import ModalJurnal from "./components/ModalJurnal.vue";
import { JURNAL_LIST_KEY } from "./data";
import { groupJurnalRows, jurnalColumns } from "./model";

const page = ref(1);
const search = ref("");
const limit = 10;
const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "jurnal", "manage"));

watch(search, () => {
  page.value = 1;
}, { flush: "sync" });

const { data, status, error, refresh } = useApi<JurnalResponse>("/api/v1/jurnal", {
  key: JURNAL_LIST_KEY,
  query: { page, limit, search },
});
const total = computed(() => data.value?.total ?? 0);
const journals = computed(() => groupJurnalRows(data.value?.data ?? []));

async function refreshList() {
  await refresh();
  if (!error.value) {
    page.value = Math.min(page.value, Math.max(1, Math.ceil(total.value / limit)));
  }
}

function openForm() {
  if (!canManage.value)
    return;
  openModal(ModalJurnal, { refresh: refreshList });
}

function viewJurnal(jurnal: JurnalSummary) {
  openModal(ModalDetailJurnal, { id: jurnal.id });
}

function deleteJurnal(ids: number[]) {
  if (!canManage.value || !ids.length)
    return;
  openModal(ModalConfirmDelete, {
    title: "Hapus Jurnal",
    description: `Apakah Anda yakin ingin menghapus ${ids.length} jurnal beserta seluruh rincian akunnya?`,
    path: `${API_URL}/api/v1/jurnal`,
    body: { ids },
    confirmText: "Hapus",
    cancelText: "Batal",
    refresh: refreshList,
  });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Jurnal Transaksi
        </h1>
        <p class="mt-1 text-sm text-muted">
          Kelola pencatatan transaksi dan rincian debit–kredit setiap jurnal.
        </p>
      </div>
      <UButton v-if="canManage" icon="i-tabler-plus" class="justify-center" @click="openForm">
        Tambah Jurnal
      </UButton>
    </div>
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row">
          <InputSearch v-model="search" placeholder="Cari kode transaksi..." aria-label="Cari jurnal" />
        </div>
        <UAlert
          v-if="error"
          title="Gagal Memuat Jurnal"
          description="Data jurnal belum dapat dimuat. Silakan coba lagi."
          color="error"
          variant="subtle"
          icon="i-tabler-alert-circle"
          :actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: refreshList }]"
        />
        <DataTable
          v-else
          v-model:page="page"
          :data="journals"
          :columns="jurnalColumns"
          :loading="status === 'pending'"
          :total="total"
          :selectable="canManage"
          :deletable="canManage"
          viewable
          enumerate
          pagination
          @view="viewJurnal"
          @delete="deleteJurnal"
        >
          <template #kodeTransaksi-cell="{ row }">
            <UButton color="neutral" variant="link" class="p-0 font-mono" @click="viewJurnal(row.original)">
              {{ row.original.kodeTransaksi }}
            </UButton>
          </template>
          <template #keterangan-cell="{ row }">
            <p class="max-w-xs truncate" :title="row.original.keterangan || undefined">
              {{ row.original.keterangan || '—' }}
            </p>
          </template>
          <template #empty>
            <div class="py-8 text-center">
              <UIcon name="i-tabler-receipt-2" class="mb-2 size-8 text-dimmed" />
              <p class="font-medium text-highlighted">
                {{ search ? 'Tidak ada jurnal yang sesuai' : 'Belum ada jurnal' }}
              </p>
              <p class="mt-1 text-sm text-muted">
                {{ search ? 'Coba kode transaksi lain.' : canManage ? 'Klik Tambah Jurnal untuk mencatat transaksi pertama.' : 'Belum ada jurnal yang tersedia.' }}
              </p>
            </div>
          </template>
        </DataTable>
      </div>
    </UCard>
  </div>
</template>
