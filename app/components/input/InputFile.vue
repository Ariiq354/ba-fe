<script setup lang="ts">
import { IMAGE_URL } from "~/constants";

defineProps<{
  disabled: boolean;
  label?: string;
  description?: string;
}>();

const foto = defineModel<string | undefined>("foto", {
  required: true,
});

const file = defineModel<File | undefined | null>("file", {
  required: true,
});
</script>

<template>
  <div v-if="foto" class="group relative w-40">
    <NuxtImg :src="`${IMAGE_URL}/${foto}`" class="ring-1 ring-muted rounded-lg object-cover object-center aspect-square w-40" />
    <UButton
      v-if="!disabled"
      icon="i-tabler-x"
      color="neutral"
      :ui="{ leadingIcon: 'size-4' }"
      class="absolute -inset-e-1.5 -top-1.5 rounded-full p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
      @click="() => { foto = undefined }"
    />
  </div>
  <UFileUpload
    v-else
    v-model="file"
    highlight
    color="neutral"
    icon="i-tabler-photo"
    :label="label"
    :description="description"
    class="aspect-square w-40"
    :disabled="disabled"
  />
</template>
