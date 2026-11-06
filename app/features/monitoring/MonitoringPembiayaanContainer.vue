<script setup lang="ts">
import type { MonitoringPembiayaan } from "./model";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { authClient } from "~/utils/auth";
import { monitoringPembiayaanColumns } from "./model";

const session = authClient.useSession();
const isAdmin = computed(() => session.value.data?.user.role === "admin");
const { data, status, error, refresh } = useApi<{ data: MonitoringPembiayaan[] }>(
  "/api/v1/pembiayaan/monitoring",
  { enabled: isAdmin, watch: [isAdmin] },
);
</script>

<template>
  <div class="min-w-0 space-y-6">
    <h1 class="text-2xl font-semibold text-highlighted">Monitoring Pembiayaan</h1>
    <UCard class="min-w-0">
      <UAlert
        v-if="error"
        title="Gagal Memuat Monitoring Pembiayaan"
        color="error"
        variant="subtle"
        :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refresh() }]"
      />
      <DataTable
        v-else
        :data="status === 'success' ? (data?.data ?? []) : []"
        :columns="monitoringPembiayaanColumns"
        :loading="status === 'pending'"
        enumerate
      >
        <template #tujuan-cell="{ row }">
          <p class="max-w-xs truncate" :title="row.original.tujuan">
            {{ row.original.tujuan }}
          </p>
        </template>
        <template #empty>
          <p class="py-8 text-center text-muted">Belum ada pembiayaan approved.</p>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
