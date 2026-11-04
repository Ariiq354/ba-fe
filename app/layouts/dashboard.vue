<script setup lang="ts">
import DashboardSidebar from "~/components/dashboard/DashboardSidebar.vue";
</script>

<template>
  <UDashboardGroup>
    <DashboardSidebar />
    <slot />
  </UDashboardGroup>
</template>
