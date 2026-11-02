<script setup lang="ts">
import SimpananContainer from "~/features/simpanan/SimpananContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Simpanan" } },
});
useHead({ title: "Simpanan · Berkah Amanah" });
</script>

<template>
  <SimpananContainer />
</template>
