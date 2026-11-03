<script setup lang="ts">
import type { PembiayaanOption } from "~/features/pembiayaan/model";

const props = withDefaults(
  defineProps<{ options: PembiayaanOption[]; loading?: boolean; disabled?: boolean }>(),
  { loading: false, disabled: false },
);
const selectedId = defineModel<number>();
const searchTerm = ref("");
const items = computed(() =>
  props.options.map((item) => ({
    label: item.tujuan,
    value: item.id,
  })),
);
watch(
  () => props.options,
  () => {
    searchTerm.value = "";
  },
);
</script>

<template>
  <USelectMenu
    v-model="selectedId"
    v-model:search-term="searchTerm"
    :items="items"
    value-key="value"
    placeholder="Pilih pembiayaan"
    :search-input="{ placeholder: 'Cari tujuan pembiayaan...' }"
    :loading="loading"
    :disabled="disabled || loading"
    :ui="{ content: 'min-w-72' }"
    aria-label="Pilih pembiayaan"
    class="w-full"
  >
    <template #empty>Tidak ada pembiayaan yang dapat diangsur</template>
  </USelectMenu>
</template>
