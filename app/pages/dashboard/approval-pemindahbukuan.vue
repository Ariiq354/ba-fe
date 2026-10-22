<script setup lang="ts">
import ApprovalPemindahbukuanContainer from "~/features/pemindahbukuan/ApprovalPemindahbukuanContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Persetujuan pemindahbukuan" } },
});
useHead({ title: "Persetujuan pemindahbukuan · Berkah Amanah" });
</script>

<template>
  <ApprovalPemindahbukuanContainer />
</template>
