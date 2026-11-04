<script setup lang="ts">
import BerandaContainer from "~/features/beranda/BerandaContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Beranda",
    },
  },
});

useHead({
  title: "Beranda · Berkah Amanah",
});
</script>

<template>
  <BerandaContainer />
</template>
