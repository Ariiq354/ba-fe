<script setup lang="ts">
import MutasiSimpananContainer from "~/features/simpanan/MutasiSimpananContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Mutasi Simpanan" } },
});
useHead({ title: "Mutasi Simpanan · Berkah Amanah" });
</script>

<template>
  <MutasiSimpananContainer />
</template>
