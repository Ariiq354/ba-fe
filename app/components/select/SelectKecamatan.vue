<script setup lang="ts">
import { useApi } from "~/composables/fetch";

interface Kecamatan {
  data: {
    id: string;
    idKota: string;
    kecamatan: string;
  }[];
}

const props = defineProps<{
  idKota?: string;
  disabled?: boolean;
}>();

const selectedKecamatan = defineModel<string>();

const nuxtApp = useNuxtApp();
const { data, status, execute } = useApi<Kecamatan>("/api/v1/wilayah/kecamatan", {
  key: computed(() => `kecamatan-options-${props.idKota ?? ""}`),
  query: { idKabupatenKota: computed(() => props.idKota) },
  immediate: Boolean(props.idKota),
  watch: false,
  getCachedData: (key) => {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key];
  },
});

watch(
  () => props.idKota,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      selectedKecamatan.value = undefined;
      if (newVal) {
        execute();
      }
    }
  },
);
</script>

<template>
  <USelectMenu
    v-model="selectedKecamatan"
    :items="data?.data ?? []"
    label-key="kecamatan"
    value-key="id"
    :disabled="disabled || !idKota || status === 'pending'"
    :loading="status === 'pending'"
    placeholder="Pilih Kecamatan"
  />
</template>
