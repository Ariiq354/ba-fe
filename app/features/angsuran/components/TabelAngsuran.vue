<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Angsuran } from "../model";
import type { StatusMutasi } from "~/features/simpanan/model";
import DataTable from "~/components/table/DataTable.vue";
import { statusMutasiLabels } from "~/features/simpanan/model";
import { angsuranColumns } from "../model";

defineProps<{
  data: Angsuran[];
  loading: boolean;
  total: number;
  dropdownItems: (item: Angsuran) => DropdownMenuItem[];
}>();
const emit = defineEmits<{ view: [item: Angsuran] }>();
const page = defineModel<number>("page", { default: 1 });
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="data"
    :columns="angsuranColumns"
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
        >{{ row.original.kodeTransaksi }}</UButton
      >
    </template>
    <template #statusApproved-cell="{ row }">
      <UBadge
        :color="statusMutasiLabels[row.original.statusApproved as StatusMutasi].color"
        variant="subtle"
        >{{ statusMutasiLabels[row.original.statusApproved as StatusMutasi].label }}</UBadge
      >
    </template>
    <template #empty>
      <div class="py-8 text-center">
        <UIcon name="i-tabler-calendar-dollar" class="mb-2 size-8 text-dimmed" />
        <p class="font-medium text-highlighted">Tidak ada angsuran</p>
      </div>
    </template>
  </DataTable>
</template>
