<script setup lang="ts">
import PembiayaanEksternalContainer from "~/features/pembiayaan-eksternal/PembiayaanEksternalContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Pembiayaan Eksternal" } },
});
useHead({ title: "Pembiayaan Eksternal · Berkah Amanah" });
</script>

<template>
  <PembiayaanEksternalContainer />
</template>
