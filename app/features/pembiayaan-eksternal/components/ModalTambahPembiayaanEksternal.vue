<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { TambahPembiayaanEksternal } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient } from "~/utils/auth";
import { getJakartaDate } from "~/utils/date";
import { maxExternalAmount, pembiayaanEksternalSchema } from "../model";

const props = defineProps<{ refresh: () => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const isAdmin = computed(() => session.value.data?.user.role === "admin");
const isLoading = ref(false);
const today = getJakartaDate();
const state = reactive({
  tanggalPembiayaan: today,
  jumlahPokok: undefined as number | undefined,
  jumlahMargin: 0,
  jangkaWaktuBulan: undefined as number | undefined,
  tujuan: "",
});

async function onSubmit(event: FormSubmitEvent<TambahPembiayaanEksternal>) {
  if (isLoading.value || !isAdmin.value) return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/pembiayaan-eksternal", {
      baseURL: API_URL,
      credentials: "include",
      method: "POST",
      retry: 0,
      body: event.data,
    });
  } catch (error) {
    useToastError(
      "Gagal Menyimpan Pembiayaan",
      extractErrorMessage(error, "Pembiayaan gagal disimpan."),
    );
    isLoading.value = false;
    return;
  }
  useToastSuccess("Pembiayaan Berhasil Dibukukan", "Pembiayaan dan jurnal telah dicatat.");
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    title="Tambah Pembiayaan Eksternal"
    description="Langsung dibukukan dan tidak dapat diubah."
    :ui="{ content: 'sm:max-w-2xl' }"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-pembiayaan-eksternal"
        :schema="pembiayaanEksternalSchema"
        :state="state"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Tanggal Pembiayaan" name="tanggalPembiayaan" required>
            <UInput
              v-model="state.tanggalPembiayaan"
              type="date"
              min="0001-01-01"
              :max="today"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Jumlah Pokok" name="jumlahPokok" required>
            <UInputNumber
              v-model="state.jumlahPokok"
              :min="1"
              :max="maxExternalAmount"
              :step="1"
              :increment="false"
              :decrement="false"
              :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }"
              locale="id-ID"
              placeholder="Rp0"
              disable-wheel-change
              class="w-full"
            />
          </UFormField>
          <UFormField label="Jumlah Margin" name="jumlahMargin" required>
            <UInputNumber
              v-model="state.jumlahMargin"
              :min="0"
              :max="maxExternalAmount"
              :step="1"
              :increment="false"
              :decrement="false"
              :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }"
              locale="id-ID"
              disable-wheel-change
              class="w-full"
            />
          </UFormField>
          <UFormField label="Tenor (Bulan)" name="jangkaWaktuBulan" required>
            <UInputNumber
              v-model="state.jangkaWaktuBulan"
              :min="1"
              :max="1200"
              :step="1"
              disable-wheel-change
              class="w-full"
            />
          </UFormField>
        </div>
        <UFormField label="Tujuan" name="tujuan" required>
          <UTextarea v-model="state.tujuan" class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton color="neutral" variant="outline" :disabled="isLoading" @click="emit('close')"
          >Batal</UButton
        >
        <UButton
          type="submit"
          form="form-pembiayaan-eksternal"
          :loading="isLoading"
          :disabled="!isAdmin || isLoading"
          >Simpan</UButton
        >
      </div>
    </template>
  </UModal>
</template>
