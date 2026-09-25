<script setup lang="ts">
import { useApi } from "~/composables/fetch";

interface Provinsi {
  data:
  {
    id: string;
    provinsi: string;
  }[];
}

defineProps<{
  disabled?: boolean;
}>();

const nuxtApp = useNuxtApp();
const { data, status } = useApi<Provinsi>("/api/v1/wilayah/provinsi", {
  key: "provinsi-options",
  getCachedData: (key) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

const selectedProvinsi = defineModel<string>();
</script>

<template>
  <USelectMenu
    v-model="selectedProvinsi"
    :items="data?.data ?? []"
    label-key="provinsi"
    value-key="id"
    :disabled="disabled || status === 'pending'"
    :loading="status === 'pending'"
    placeholder="Pilih Provinsi"
  />
</template>
