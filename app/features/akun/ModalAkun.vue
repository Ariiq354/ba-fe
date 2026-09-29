<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Akun, AkunSchema } from "./model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { akunSchema, initAkunFormdata, kategoriOptions, normalBalanceOptions } from "./model";

const props = defineProps<{
  akun?: Akun;
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const state = reactive<AkunSchema>({ ...initAkunFormdata, ...props.akun });
const isLoading = ref(false);

async function onSubmit(event: FormSubmitEvent<AkunSchema>) {
  if (isLoading.value)
    return;
  isLoading.value = true;

  try {
    await $fetch(props.akun ? `/api/v1/master-akun/${encodeURIComponent(props.akun.id)}` : "/api/v1/master-akun", {
      baseURL: API_URL,
      method: props.akun ? "PATCH" : "POST",
      credentials: "include",
      body: event.data,
    });
  }
  catch (error) {
    useToastError("Gagal Menyimpan Akun", extractErrorMessage(error, "Akun gagal disimpan. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }

  useToastSuccess(props.akun ? "Akun Berhasil Diperbarui" : "Akun Berhasil Ditambahkan");
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    :title="akun ? 'Edit Akun' : 'Tambah Akun'"
    description="Lengkapi informasi akun untuk pencatatan keuangan."
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-akun"
        :schema="akunSchema"
        :state="state"
        :disabled="isLoading"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Kode Akun" name="kodeAkun" required>
          <UInput v-model="state.kodeAkun" placeholder="Contoh: 1101" class="w-full" />
        </UFormField>
        <UFormField label="Nama Akun" name="namaAkun" required>
          <UInput v-model="state.namaAkun" placeholder="Contoh: Kas" class="w-full" />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Kategori" name="kategori" required>
            <USelect v-model="state.kategori" :items="kategoriOptions" class="w-full" />
          </UFormField>
          <UFormField label="Saldo Normal" name="normalBalance" required>
            <USelect v-model="state.normalBalance" :items="normalBalanceOptions" class="w-full" />
          </UFormField>
        </div>
        <UFormField label="Status" name="isActive">
          <USwitch v-model="state.isActive" label="Akun aktif" />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton type="submit" form="form-akun" icon="i-tabler-check" :loading="isLoading">
          Simpan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
