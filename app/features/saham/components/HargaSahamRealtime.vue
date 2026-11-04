<script setup lang="ts">
import type { HargaSahamRealtimeResponse } from "../model";
import { useApi } from "~/composables/fetch";
import { formatRupiah } from "~/utils/format";

const { data, status, error, refresh } = useApi<HargaSahamRealtimeResponse>(
  "/api/v1/master-saham/realtime",
);
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-muted">Harga Saham Realtime</p>
      <UButton
        label="Refresh"
        icon="i-tabler-refresh"
        color="neutral"
        variant="ghost"
        size="xs"
        :loading="status === 'pending'"
        @click="() => refresh()"
      />
    </div>
    <USkeleton v-if="status === 'pending'" class="mt-3 h-7 w-32" />
    <p v-else-if="error" role="alert" class="mt-3 text-sm text-error">
      Gagal memuat harga realtime. Coba refresh.
    </p>
    <p v-else-if="data?.hargaRealtime === null" class="mt-3 text-sm text-muted">
      Belum ada saham beredar
    </p>
    <p v-else class="mt-3 text-xl font-semibold text-highlighted tabular-nums">
      {{ data?.hargaRealtime != null ? formatRupiah(data.hargaRealtime) : "—" }}
    </p>
  </div>
</template>
