<script setup lang="ts">
import type { MonitoringSimpanan } from "./model";
import SelectKelompok from "~/components/select/SelectKelompok.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { authClient } from "~/utils/auth";
import { monitoringSimpananColumns } from "./model";

const session = authClient.useSession();
const isAdmin = computed(() => session.value.data?.user.role === "admin");
const idKelompok = ref<number>();
const { data, status, error, refresh } = useApi<{ data: MonitoringSimpanan[] }>(
  "/api/v1/simpanan/monitoring",
  {
    enabled: isAdmin,
    watch: [isAdmin],
    query: { idKelompok },
  },
);
</script>

<template>
  <div class="min-w-0 space-y-6">
    <h1 class="text-2xl font-semibold text-highlighted">Monitoring Simpanan</h1>
    <div class="flex flex-wrap items-end gap-3">
      <UFormField label="Kelompok" class="w-full sm:max-w-xs">
        <SelectKelompok v-model="idKelompok" aria-label="Filter kelompok simpanan" class="w-full" />
      </UFormField>
      <UButton
        v-if="idKelompok !== undefined"
        color="neutral"
        variant="outline"
        icon="i-tabler-x"
        @click="idKelompok = undefined"
      >
        Semua Kelompok
      </UButton>
    </div>
    <UCard class="min-w-0">
      <UAlert
        v-if="error"
        title="Gagal Memuat Monitoring Simpanan"
        color="error"
        variant="subtle"
        :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refresh() }]"
      />
      <DataTable
        v-else
        :data="status === 'success' ? (data?.data ?? []) : []"
        :columns="monitoringSimpananColumns"
        :loading="status === 'pending'"
        enumerate
      >
        <template #empty>
          <p class="py-8 text-center text-muted">Belum ada data simpanan.</p>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
