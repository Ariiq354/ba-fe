<script setup lang="ts">
import type { Margin, MarginResponse } from "./model";
import ModalConfirmDelete from "~/components/modal/ModalConfirmDelete.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import ModalMargin from "./components/ModalMargin.vue";
import { marginColumns } from "./model";

const page = ref(1);
const limit = 10;
const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "masterMargin", "manage"));
const { data, status, error, refresh } = useApi<MarginResponse>("/api/v1/master-margin", {
  query: { page, limit },
});
const total = computed(() => data.value?.total ?? 0);

async function refreshList() {
  await refresh();
  if (!error.value) {
    page.value = Math.min(page.value, Math.max(1, Math.ceil(total.value / limit)));
  }
}

function openForm(margin?: Margin) {
  if (!canManage.value)
    return;
  openModal(ModalMargin, { margin, refresh: refreshList });
}

function deleteMargin(ids: number[]) {
  if (!canManage.value || !ids.length)
    return;
  openModal(ModalConfirmDelete, {
    title: "Hapus Margin",
    description: `Apakah Anda yakin ingin menghapus ${ids.length} margin yang dipilih?`,
    path: `${API_URL}/api/v1/master-margin`,
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
          Master Margin
        </h1>
        <p class="mt-1 text-sm text-muted">
          Kelola margin, jaminan, dan biaya akad berdasarkan rentang nominal pembiayaan.
        </p>
      </div>
      <UButton v-if="canManage" icon="i-tabler-plus" class="justify-center" @click="openForm()">
        Tambah Margin
      </UButton>
    </div>
    <UCard>
      <UAlert
        v-if="error"
        title="Gagal Memuat Margin"
        description="Data margin belum dapat dimuat. Silakan coba lagi."
        color="error"
        variant="subtle"
        icon="i-tabler-alert-circle"
        :actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: refreshList }]"
      />
      <DataTable
        v-else
        v-model:page="page"
        :data="data?.data ?? []"
        :columns="marginColumns"
        :loading="status === 'pending'"
        :total="total"
        :selectable="canManage"
        :editable="canManage"
        :deletable="canManage"
        enumerate
        pagination
        @edit="openForm"
        @delete="deleteMargin"
      >
        <template #empty>
          <div class="py-8 text-center">
            <UIcon name="i-tabler-percentage" class="mb-2 size-8 text-dimmed" />
            <p class="font-medium text-highlighted">
              Belum ada margin
            </p>
            <p class="mt-1 text-sm text-muted">
              {{ canManage ? 'Klik Tambah Margin untuk membuat ketentuan margin pertama.' : 'Belum ada margin yang tersedia.' }}
            </p>
          </div>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
