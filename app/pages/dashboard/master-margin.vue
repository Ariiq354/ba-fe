<script setup lang="ts">
import MarginContainer from "~/features/margin/MarginContainer.vue";

definePageMeta({
  layout: {
    name: "default",
    props: {
      title: "Master Margin",
    },
  },
});

useHead({
  title: "Master Margin · Berkah Amanah",
});
</script>

<template>
  <MarginContainer />
</template>
