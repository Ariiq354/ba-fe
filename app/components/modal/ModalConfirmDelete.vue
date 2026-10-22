<script lang="ts" setup>
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";

const props = withDefaults(
  defineProps<{
    path?: string;
    body?: object;
    refresh?: () => Promise<void> | void;
    title?: string;
    description?: string;
    method?: "DELETE" | "PATCH" | "POST" | "PUT";
    confirmText?: string;
    cancelText?: string;
    confirmColor?: "error" | "primary" | "secondary" | "success" | "warning" | "info" | "neutral";
    onConfirm?: () => Promise<void> | void;
  }>(),
  {
    title: "Konfirmasi",
    description: "Apakah Anda yakin ingin menghapus item yang dipilih?",
    method: "DELETE",
    confirmText: "Ya",
    cancelText: "Tidak",
    confirmColor: "error",
  },
);

const emit = defineEmits(["close"]);

const loading = ref(false);
async function onClick() {
  loading.value = true;
  try {
    if (props.onConfirm) {
      await props.onConfirm();
    } else if (props.path) {
      await $fetch(`${props.path}`, {
        method: props.method,
        body: props.body,
        credentials: "include",
      });
      useToastSuccess(
        props.method === "DELETE" ? "Berhasil Hapus Data" : "Berhasil Memproses Data",
      );
    }
    await props.refresh?.();
    emit("close", false);
  } catch (error) {
    useToastError(
      "Gagal Memproses",
      extractErrorMessage(error, "Terjadi kesalahan dalam memproses data."),
    );
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    :close="{ onClick: () => emit('close', false) }"
    :ui="{ content: 'sm:max-w-md' }"
    :title="title"
  >
    <template #body>
      <p class="text-sm leading-relaxed text-default">{{ description }}</p>
    </template>
    <template #footer>
      <UButton :disabled="loading" variant="ghost" color="neutral" @click="emit('close')">
        {{ cancelText }}
      </UButton>
      <UButton :loading="loading" :color="confirmColor" @click="onClick">
        {{ confirmText }}
      </UButton>
    </template>
  </UModal>
</template>
