<script setup lang="ts">
import MonitoringShuContainer from "~/features/monitoring/MonitoringShuContainer.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Monitoring SHU" } },
});
useHead({ title: "Monitoring SHU · Berkah Amanah" });
</script>

<template>
  <MonitoringShuContainer />
</template>
