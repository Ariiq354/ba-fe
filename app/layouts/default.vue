<script setup lang="ts">
import DashboardSidebar from "~/components/dashboard/DashboardSidebar.vue";

defineProps<{
  title?: string;
}>();
</script>

<template>
  <UDashboardGroup unit="rem" class="dashboard-shell">
    <DashboardSidebar />

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar
          :title="title"
          :as="{ root: 'header', title: 'span' }"
          :ui="{ title: 'text-sm font-medium text-muted' }"
        >
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
