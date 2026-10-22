<script setup lang="ts">
import ApprovalSimpananContainer from "~/features/simpanan/ApprovalSimpananContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Persetujuan simpanan" } },
});
useHead({ title: "Persetujuan simpanan · Berkah Amanah" });
</script>

<template>
  <ApprovalSimpananContainer />
</template>
