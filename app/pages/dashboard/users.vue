<script setup lang="ts">
import PenggunaContainer from "~/features/pengguna/PenggunaContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Daftar Pengguna",
    },
  },
});

useHead({
  title: "Daftar Pengguna · Berkah Amanah",
});
</script>

<template>
  <PenggunaContainer />
</template>
