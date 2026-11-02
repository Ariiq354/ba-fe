<script setup lang="ts">
import PemindahbukuanContainer from "~/features/pemindahbukuan/PemindahbukuanContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Pemindahbukuan" } },
});
useHead({ title: "Pemindahbukuan · Berkah Amanah" });
</script>

<template>
  <PemindahbukuanContainer />
</template>
