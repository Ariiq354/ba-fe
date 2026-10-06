<script setup lang="ts">
import type { Akun, AkunResponse, KategoriFilter } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import ModalConfirmDelete from "~/components/modal/ModalConfirmDelete.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import ModalAkun from "./components/ModalAkun.vue";
import { akunColumns, kategoriFilterOptions } from "./model";

const page = ref(1);
const search = ref("");
const kategori = ref<KategoriFilter>("all");
const limit = 10;
const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "masterAkun", "manage"));

watch([search, kategori], () => {
  page.value = 1;
}, { flush: "sync" });

const { data, status, error, refresh } = useApi<AkunResponse>("/api/v1/master-akun", {
  query: { page, limit, search, kategori },
});
const total = computed(() => Number(data.value?.total) || 0);

async function refreshList() {
  await refresh();
  if (!error.value) {
    page.value = Math.min(page.value, Math.max(1, Math.ceil(total.value / limit)));
  }
}

function openForm(akun?: Akun) {
  if (!canManage.value)
    return;
  openModal(ModalAkun, { akun, refresh: refreshList });
}

function deleteAkun(ids: string[]) {
  if (!canManage.value || !ids.length)
    return;
  openModal(ModalConfirmDelete, {
    title: "Hapus Akun",
    description: `Apakah Anda yakin ingin menghapus ${ids.length} akun yang dipilih?`,
    path: `${API_URL}/api/v1/master-akun`,
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
          Master Akun
        </h1>
        <p class="mt-1 text-sm text-muted">
          Kelola daftar akun untuk pencatatan keuangan.
        </p>
      </div>
      <UButton v-if="canManage" icon="i-tabler-plus" class="justify-center" @click="openForm()">
        Tambah Akun
      </UButton>
    </div>

    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row">
          <InputSearch v-model="search" placeholder="Cari kode atau nama akun..." aria-label="Cari akun" />
          <USelect
            v-model="kategori"
            :items="kategoriFilterOptions"
            aria-label="Filter kategori akun"
            class="w-full sm:w-48"
          />
        </div>

        <UAlert
          v-if="error"
          title="Gagal Memuat Akun"
          description="Data akun belum dapat dimuat. Silakan coba lagi."
          color="error"
          variant="subtle"
          icon="i-tabler-alert-circle"
          :actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: refreshList }]"
        />

        <DataTable
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :columns="akunColumns"
          :loading="status === 'pending'"
          :total="total"
          :selectable="canManage"
          enumerate
          :editable="canManage"
          :deletable="canManage"
          pagination
          @edit="openForm"
          @delete="deleteAkun"
        >
          <template #kodeAkun-cell="{ row }">
            <span class="font-mono font-medium">{{ row.original.kodeAkun }}</span>
          </template>
          <template #kategori-cell="{ row }">
            <UBadge color="neutral" variant="subtle" class="capitalize">
              {{ row.original.kategori }}
            </UBadge>
          </template>
          <template #normalBalance-cell="{ row }">
            <span class="capitalize">{{ row.original.normalBalance }}</span>
          </template>
          <template #isActive-cell="{ row }">
            <UBadge :color="row.original.isActive ? 'success' : 'neutral'" variant="subtle">
              {{ row.original.isActive ? 'Aktif' : 'Nonaktif' }}
            </UBadge>
          </template>
          <template #empty>
            <div class="py-8 text-center">
              <UIcon name="i-tabler-book-2" class="mb-2 size-8 text-dimmed" />
              <p class="font-medium text-highlighted">
                {{ search || kategori !== 'all' ? 'Tidak ada akun yang sesuai' : 'Belum ada akun' }}
              </p>
              <p class="mt-1 text-sm text-muted">
                {{ search || kategori !== 'all' ? 'Coba kata kunci atau kategori lain.' : canManage ? 'Klik Tambah Akun untuk membuat akun pertama.' : 'Belum ada akun yang tersedia.' }}
              </p>
            </div>
          </template>
        </DataTable>
      </div>
    </UCard>
  </div>
</template>
