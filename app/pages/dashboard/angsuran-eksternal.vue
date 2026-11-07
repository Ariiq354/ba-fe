<script setup lang="ts">
import AngsuranEksternalContainer from "~/features/angsuran-eksternal/AngsuranEksternalContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Angsuran Eksternal" } },
});
useHead({ title: "Angsuran Eksternal · Berkah Amanah" });
</script>

<template>
  <AngsuranEksternalContainer />
</template>
