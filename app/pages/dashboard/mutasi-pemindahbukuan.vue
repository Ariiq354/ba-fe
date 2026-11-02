<script setup lang="ts">
import MutasiPemindahbukuanContainer from "~/features/pemindahbukuan/MutasiPemindahbukuanContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Mutasi Pemindahbukuan" } },
});
useHead({ title: "Mutasi Pemindahbukuan · Berkah Amanah" });
</script>

<template>
  <MutasiPemindahbukuanContainer />
</template>
