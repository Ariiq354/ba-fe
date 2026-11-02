<script setup lang="ts">
import MutasiPemindahbukuanContainer from "~/features/pemindahbukuan/MutasiPemindahbukuanContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Daftar Pemindahbukuan" } },
});
useHead({ title: "Daftar Pemindahbukuan · Berkah Amanah" });
</script>

<template>
  <MutasiPemindahbukuanContainer />
</template>
