<script setup lang="ts">
import { useApi } from "~/composables/fetch";

interface Kelompok {
  data: {
    id: number;
    kodeKelompok: string;
    namaKelompok: string;
    createdAt: Date;
  }[];
}

defineProps<{
  disabled?: boolean;
}>();

const nuxtApp = useNuxtApp();
const { data, status } = useApi("/api/v1/kelompok/options", {
  key: "kelompok-options",
  transform: (data: Kelompok) =>
    data.data.map(item => ({
      label: `${item.kodeKelompok} - ${item.namaKelompok}`,
      value: item.id,
    })),
  getCachedData: (key) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

const selectedKelompok = defineModel<number>();
</script>

<template>
  <USelectMenu
    v-model="selectedKelompok"
    :items="data ?? []"
    label-key="label"
    value-key="value"
    :disabled="disabled || status === 'pending'"
    :loading="status === 'pending'"
    :search-input="false"
    placeholder="Pilih Kelompok"
  />
</template>
