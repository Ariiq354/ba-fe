<script setup lang="ts">
import ShuContainer from "~/features/shu/ShuContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Bagi Hasil Usaha" } },
});
useHead({ title: "Bagi Hasil Usaha · Berkah Amanah" });
</script>

<template>
  <ShuContainer />
</template>
