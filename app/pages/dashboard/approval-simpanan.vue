<script setup lang="ts">
import ApprovalSimpananContainer from "~/features/simpanan/ApprovalSimpananContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Approval Simpanan" } },
});
useHead({ title: "Approval Simpanan · Berkah Amanah" });
</script>

<template>
  <ApprovalSimpananContainer />
</template>
