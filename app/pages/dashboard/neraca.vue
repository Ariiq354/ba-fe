<script setup lang="ts">
import NeracaContainer from "~/features/laporan-keuangan/NeracaContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Neraca" } },
});
useHead({ title: "Neraca · Berkah Amanah" });
</script>

<template>
  <NeracaContainer />
</template>
