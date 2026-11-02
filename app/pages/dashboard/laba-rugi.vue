<script setup lang="ts">
import LabaRugiContainer from "~/features/laporan-keuangan/LabaRugiContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Laba Rugi" } },
});
useHead({ title: "Laba Rugi · Berkah Amanah" });
</script>

<template>
  <LabaRugiContainer />
</template>
