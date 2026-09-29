<script setup lang="ts">
import AkunContainer from "~/features/akun/AkunContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Master Akun",
    },
  },
});

useHead({
  title: "Master Akun · Berkah Amanah",
});
</script>

<template>
  <AkunContainer />
</template>
