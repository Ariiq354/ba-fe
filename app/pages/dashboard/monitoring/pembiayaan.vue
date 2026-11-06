<script setup lang="ts">
import MonitoringPembiayaanContainer from "~/features/monitoring/MonitoringPembiayaanContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Monitoring Pembiayaan" } },
});
useHead({ title: "Monitoring Pembiayaan · Berkah Amanah" });
</script>

<template>
  <MonitoringPembiayaanContainer />
</template>
