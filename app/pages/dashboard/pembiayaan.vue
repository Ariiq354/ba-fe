<script setup lang="ts">
import PembiayaanContainer from "~/features/pembiayaan/PembiayaanContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Pembiayaan" } },
});
useHead({ title: "Pembiayaan · Berkah Amanah" });
</script>

<template>
  <PembiayaanContainer />
</template>
