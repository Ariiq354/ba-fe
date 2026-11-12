<script setup lang="ts">
import AngsuranContainer from "~/features/angsuran/AngsuranContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Daftar Angsuran" } },
});
useHead({ title: "Daftar Angsuran · Berkah Amanah" });
</script>

<template>
  <AngsuranContainer approval />
</template>
