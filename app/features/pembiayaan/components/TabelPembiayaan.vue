<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Pembiayaan } from "../model";
import type { StatusMutasi } from "~/features/simpanan/model";
import DataTable from "~/components/table/DataTable.vue";
import { statusMutasiLabels } from "~/features/simpanan/model";
import { pembiayaanColumns } from "../model";

defineProps<{
  data: Pembiayaan[];
  loading: boolean;
  total: number;
  dropdownItems: (item: Pembiayaan) => DropdownMenuItem[];
}>();
const emit = defineEmits<{ view: [item: Pembiayaan] }>();
const page = defineModel<number>("page", { default: 1 });
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="data"
    :columns="pembiayaanColumns"
    :loading="loading"
    :total="total"
    :dropdown-items="dropdownItems"
    viewable
    enumerate
    pagination
    @view="emit('view', $event)"
  >
    <template #kodeTransaksi-cell="{ row }">
      <UButton
        color="neutral"
        variant="link"
        class="p-0 font-mono"
        @click="emit('view', row.original)"
      >
        {{ row.original.kodeTransaksi }}
      </UButton>
    </template>
    <template #statusApproved-cell="{ row }">
      <UBadge
        :color="statusMutasiLabels[row.original.statusApproved as StatusMutasi].color"
        variant="subtle"
      >
        {{ statusMutasiLabels[row.original.statusApproved as StatusMutasi].label }}
      </UBadge>
    </template>
    <template #empty>
      <div class="py-8 text-center">
        <UIcon name="i-tabler-file-invoice" class="mb-2 size-8 text-dimmed" />
        <p class="font-medium text-highlighted">Tidak ada pembiayaan</p>
        <p class="mt-1 text-sm text-muted">
          Coba kata kunci atau filter lain, atau ajukan pembiayaan baru.
        </p>
      </div>
    </template>
  </DataTable>
</template>
