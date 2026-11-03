<script setup lang="ts">
import AngsuranContainer from "~/features/angsuran/AngsuranContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Angsuran" } },
});
useHead({ title: "Angsuran · Berkah Amanah" });
</script>

<template>
  <AngsuranContainer />
</template>
