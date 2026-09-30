<script setup lang="ts">
import InputSimpananContainer from "~/features/simpanan/InputSimpananContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Input Simpanan Anggota" } },
});
useHead({ title: "Input Simpanan Anggota · Berkah Amanah" });
</script>

<template>
  <InputSimpananContainer />
</template>
