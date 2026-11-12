<script lang="ts" setup>
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";

const props = defineProps<{
  path: string;
  body: object;
  refresh: () => Promise<void>;
  title: string;
  description: string;
}>();

const emit = defineEmits(["close"]);

const loading = ref(false);
async function onClick() {
  loading.value = true;
  try {
    await $fetch(props.path, {
      method: "DELETE",
      body: props.body,
      credentials: "include",
    });
    useToastSuccess("Berhasil Hapus Data", "Data yang dipilih telah dihapus.");
    await props.refresh();
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
    :ui="{ body: 'sm:max-w-lg' }"
    :title="title"
  >
    <template #body>
      <div class="space-y-5">
        <div class="flex items-center gap-4 text-sm text-gray-700 dark:text-gray-200">
          <UIcon name="i-tabler-alert-triangle" size="36" class="shrink-0 text-red-500" />
          <div>
            {{ description }}
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <UButton
        icon="i-tabler-x"
        :disabled="loading"
        class="text-base"
        variant="ghost"
        color="neutral"
        @click="emit('close')"
      >
        Batal
      </UButton>
      <UButton
        icon="i-tabler-check"
        :loading="loading"
        color="error"
        class="text-base"
        @click="onClick"
      >
        Hapus
      </UButton>
    </template>
  </UModal>
</template>
