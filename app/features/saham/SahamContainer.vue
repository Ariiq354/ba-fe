<script setup lang="ts">
import type { HargaSahamResponse, SahamResponse } from "./model";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { PAGE_SIZE } from "~/constants";
import { formatRupiah } from "~/utils/format";
import HargaSahamRealtime from "./components/HargaSahamRealtime.vue";
import ModalSaham from "./components/ModalSaham.vue";
import { sahamColumns } from "./model";

const page = ref(1);
const { data, status, error, refresh } = useApi<SahamResponse>("/api/v1/master-saham", {
  query: { page, limit: PAGE_SIZE },
});
const {
  data: latestPrice,
  status: latestPriceStatus,
  error: latestPriceError,
  refresh: refreshLatestPrice,
} = useApi<HargaSahamResponse>("/api/v1/master-saham/latest");

async function refreshAfterCreate() {
  if (page.value !== 1) {
    page.value = 1;
    await refreshLatestPrice();
  } else {
    await Promise.all([refresh(), refreshLatestPrice()]);
  }
}

function openForm() {
  openModal(ModalSaham, { refresh: refreshAfterCreate });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Master Saham</h1>
        <p class="mt-1 text-sm text-muted">
          Kelola harga jual saham dan lihat riwayat penetapan harga, dari yang terbaru.
        </p>
      </div>
      <UButton icon="i-tabler-plus" class="justify-center" @click="openForm">
        Tambah Harga Saham
      </UButton>
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <UCard>
        <div class="flex min-h-6 items-center justify-between gap-2">
          <p class="text-sm text-muted">Harga Jual Saat Ini</p>
          <UButton
            v-if="latestPriceError && latestPriceError.status !== 404"
            label="Coba lagi"
            icon="i-tabler-refresh"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="() => refreshLatestPrice()"
          />
        </div>
        <USkeleton v-if="latestPriceStatus === 'pending'" class="mt-3 h-7 w-32" />
        <p v-else-if="latestPriceError?.status === 404" class="mt-3 text-sm text-muted">
          Belum ada harga saham
        </p>
        <p v-else-if="latestPriceError" role="alert" class="mt-3 text-sm text-error">
          Gagal memuat harga jual.
        </p>
        <p v-else class="mt-3 text-xl font-semibold text-highlighted tabular-nums">
          {{ latestPrice ? formatRupiah(latestPrice.hargaJual) : "—" }}
        </p>
      </UCard>
      <UCard>
        <HargaSahamRealtime />
      </UCard>
    </div>
    <UCard>
      <UAlert
        v-if="error"
        title="Gagal Memuat Harga Saham"
        description="Riwayat harga saham belum dapat dimuat. Silakan coba lagi."
        color="error"
        variant="subtle"
        icon="i-tabler-alert-circle"
        :actions="[
          { label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() },
        ]"
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
            <p class="font-medium text-highlighted">Belum ada harga saham</p>
            <p class="mt-1 text-sm text-muted">
              Klik Tambah Harga Saham untuk menetapkan harga pertama.
            </p>
          </div>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
