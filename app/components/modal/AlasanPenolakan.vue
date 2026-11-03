<script setup lang="ts">
defineProps<{ reason: string }>();
</script>

<template>
  <dl class="border-t border-default pt-4">
    <div class="grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-5">
      <dt class="text-sm text-muted sm:pt-0.5">Alasan Penolakan</dt>
      <dd class="leading-relaxed whitespace-pre-wrap wrap-break-word">{{ reason }}</dd>
    </div>
  </dl>
</template>
