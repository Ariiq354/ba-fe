<script setup lang="ts">
import SimpananSayaContainer from "~/features/simpanan/SimpananSayaContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Simpanan Saya" } },
});
useHead({ title: "Simpanan Saya · Berkah Amanah" });
</script>

<template>
  <SimpananSayaContainer />
</template>
