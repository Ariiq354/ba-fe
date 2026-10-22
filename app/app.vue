<script setup lang="ts">
import { dashboardTheme } from "~/utils/dashboard-theme";

const route = useRoute();
const theme = computed(() => (route.path.startsWith("/dashboard") ? dashboardTheme : {}));
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="blue" :height="5" />
    <UTheme :props="theme">
      <UApp>
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </UApp>
    </UTheme>
  </div>
</template>
