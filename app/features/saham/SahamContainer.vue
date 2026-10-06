<script setup lang="ts">
import type { SahamResponse } from "./model";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { authClient, can } from "~/utils/auth";
import ModalSaham from "./components/ModalSaham.vue";
import { sahamColumns } from "./model";

const page = ref(1);
const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "masterSaham", "manage"));
const { data, status, error, refresh } = useApi<SahamResponse>("/api/v1/master-saham", {
  query: { page, limit: 10 },
});

async function refreshList() {
  await refresh();
}

async function refreshAfterCreate() {
  if (page.value !== 1) {
    page.value = 1;
  }
  else {
    await refreshList();
  }
}

function openForm() {
  if (!canManage.value)
    return;
  openModal(ModalSaham, { refresh: refreshAfterCreate });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Master Saham
        </h1>
        <p class="mt-1 text-sm text-muted">
          Kelola harga jual saham dan lihat riwayat penetapan harga, dari yang terbaru.
        </p>
      </div>
      <UButton v-if="canManage" icon="i-tabler-plus" class="justify-center" @click="openForm">
        Tambah Harga Saham
      </UButton>
    </div>
    <UCard>
      <UAlert
        v-if="error"
        title="Gagal Memuat Harga Saham"
        description="Riwayat harga saham belum dapat dimuat. Silakan coba lagi."
        color="error"
        variant="subtle"
        icon="i-tabler-alert-circle"
        :actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: refreshList }]"
      />
      <DataTable
        v-else
        v-model:page="page"
        :data="data?.data ?? []"
        :columns="sahamColumns"
        :loading="status === 'pending'"
        :total="data?.total ?? 0"
        enumerate
        pagination
      >
        <template #empty>
          <div class="py-8 text-center">
            <UIcon name="i-tabler-chart-candle" class="mb-2 size-8 text-dimmed" />
            <p class="font-medium text-highlighted">
              Belum ada harga saham
            </p>
            <p class="mt-1 text-sm text-muted">
              {{ canManage ? 'Klik Tambah Harga Saham untuk menetapkan harga pertama.' : 'Belum ada riwayat harga saham yang tersedia.' }}
            </p>
          </div>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
