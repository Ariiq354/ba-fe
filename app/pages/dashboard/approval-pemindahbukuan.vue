<script setup lang="ts">
import ApprovalPemindahbukuanContainer from "~/features/pemindahbukuan/ApprovalPemindahbukuanContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Approval Pemindahbukuan" } },
});
useHead({ title: "Approval Pemindahbukuan · Berkah Amanah" });
</script>

<template>
  <ApprovalPemindahbukuanContainer />
</template>
