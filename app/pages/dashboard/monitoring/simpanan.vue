<script setup lang="ts">
import MonitoringSimpananContainer from "~/features/monitoring/MonitoringSimpananContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Monitoring Simpanan" } },
});
useHead({ title: "Monitoring Simpanan · Berkah Amanah" });
</script>

<template>
  <MonitoringSimpananContainer />
</template>
