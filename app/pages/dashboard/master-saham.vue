<script setup lang="ts">
import SahamContainer from "~/features/saham/SahamContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Master Saham",
    },
  },
});

useHead({
  title: "Master Saham · Berkah Amanah",
});
</script>

<template>
  <SahamContainer />
</template>
