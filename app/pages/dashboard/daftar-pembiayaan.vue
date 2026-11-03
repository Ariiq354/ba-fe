<script setup lang="ts">
import DaftarPembiayaanContainer from "~/features/pembiayaan/DaftarPembiayaanContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Daftar Pembiayaan" } },
});
useHead({ title: "Daftar Pembiayaan · Berkah Amanah" });
</script>

<template>
  <DaftarPembiayaanContainer />
</template>
