<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Pemindahbukuan } from "../model";
import DataTable from "~/components/table/DataTable.vue";
import { statusMutasiLabels } from "~/features/simpanan/model";
import { formatRupiah } from "~/utils/format";
import {
  formatPemindahbukuanValue,
  getPemindahbukuanDestination,
  pemindahbukuanColumns,
} from "../model";

withDefaults(
  defineProps<{
    data: Pemindahbukuan[];
    loading: boolean;
    total: number;
    dropdownItems: (transfer: Pemindahbukuan) => DropdownMenuItem[];
    emptyTitle?: string;
    emptyDescription?: string;
  }>(),
  {
    emptyTitle: "Tidak ada pemindahbukuan",
    emptyDescription: "Coba filter lain atau ajukan pemindahbukuan baru.",
  },
);
const emit = defineEmits<{ view: [transfer: Pemindahbukuan] }>();
const page = defineModel<number>("page", { default: 1 });
</script>

<template>
  <DataTable
    v-model:page="page"
    :data="data"
    :columns="pemindahbukuanColumns"
    :loading="loading"
    :total="total"
    :dropdown-items="dropdownItems"
    viewable
    enumerate
    pagination
    @view="emit('view', $event)"
  >
    <template #members-cell="{ row }">
      <p class="font-medium">
        {{ row.original.sourceMemberName }}
      </p>
      <p class="text-sm text-muted">→ {{ getPemindahbukuanDestination(row.original) }}</p>
    </template>
    <template #nominal-cell="{ row }">
      <p class="font-medium">
        {{ formatPemindahbukuanValue(row.original) }}
      </p>
      <p
        v-if="row.original.tipePemindahbukuan !== 'tabungan_ke_tabungan'"
        class="text-sm text-muted"
      >
        {{
          row.original.tipePemindahbukuan === "saham_ke_saham"
            ? "Referensi: "
            : row.original.tipePemindahbukuan === "pembelian_kembali_saham"
              ? "Pembayaran: "
              : ""
        }}{{ formatRupiah(row.original.nominal) }}
      </p>
    </template>
    <template #statusApproved-cell="{ row }">
      <UBadge :color="statusMutasiLabels[row.original.statusApproved].color" variant="subtle">
        {{ statusMutasiLabels[row.original.statusApproved].label }}
      </UBadge>
    </template>
    <template #empty>
      <div class="py-8 text-center">
        <UIcon name="i-tabler-transfer" class="mb-2 size-8 text-dimmed" />
        <p class="font-medium text-highlighted">{{ emptyTitle }}</p>
        <p class="mt-1 text-sm text-muted">{{ emptyDescription }}</p>
      </div>
    </template>
  </DataTable>
</template>
