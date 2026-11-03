<script setup lang="ts">
import DaftarAngsuranContainer from "~/features/angsuran/DaftarAngsuranContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Daftar Angsuran" } },
});
useHead({ title: "Daftar Angsuran · Berkah Amanah" });
</script>

<template>
  <DaftarAngsuranContainer />
</template>
