<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { SetoranTabungan } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import { APPROVAL_SIMPANAN_PENDING_KEY } from "../data";
import { maxSimpananAmount, paymentMethodOptions, setoranTabunganSchema } from "../model";

const props = defineProps<{
  userId: number;
  memberName: string;
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const canManage = computed(() => {
  const role = session.value.data?.user.role;
  return props.userId === Number(session.value.data?.user.id)
    ? can(role, "simpananSaya", "manage") || can(role, "inputSimpanan", "manage")
    : can(role, "inputSimpanan", "manage");
});
const isLoading = ref(false);
const state = reactive({
  userId: props.userId,
  metodePembayaran: undefined as SetoranTabungan["metodePembayaran"] | undefined,
  nilaiTransaksi: undefined as number | undefined,
  keterangan: "",
});
const ready = computed(() => canManage.value && !!state.metodePembayaran);

async function onSubmit(event: FormSubmitEvent<SetoranTabungan>) {
  if (isLoading.value || !ready.value) return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/simpanan/mutasi/setoran/tabungan", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: event.data,
    });
  } catch (error) {
    useToastError(
      "Gagal Mengajukan Transaksi",
      extractErrorMessage(error, "Pengajuan gagal disimpan. Silakan coba lagi."),
    );
    isLoading.value = false;
    return;
  }
  useToastSuccess("Pengajuan Berhasil", "Transaksi menunggu persetujuan admin.");
  emit("close");
  await Promise.all([props.refresh(), refreshNuxtData(APPROVAL_SIMPANAN_PENDING_KEY)]);
}
</script>

<template>
  <UModal
    title="Setor Tabungan"
    :description="`Untuk ${memberName}`"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-setoran-tabungan"
        :schema="setoranTabunganSchema"
        :state="state"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField label="Nominal setoran" name="nilaiTransaksi" required>
          <UInputNumber
            v-model="state.nilaiTransaksi"
            :min="1"
            :max="maxSimpananAmount"
            :step="1"
            :increment="false"
            :decrement="false"
            :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }"
            locale="id-ID"
            placeholder="Rp 0"
            size="xl"
            disable-wheel-change
            :ui="{ base: 'text-left font-medium tabular-nums' }"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Metode pembayaran" name="metodePembayaran" required>
          <USelectMenu
            v-model="state.metodePembayaran"
            :items="paymentMethodOptions"
            value-key="value"
            placeholder="Pilih metode pembayaran"
            :search-input="false"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Keterangan" name="keterangan" hint="Opsional">
          <UTextarea
            v-model="state.keterangan"
            placeholder="Tambahkan catatan bila perlu"
            :rows="2"
            :maxrows="4"
            autoresize
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full gap-3 sm:justify-end">
        <UButton
          color="neutral"
          variant="outline"
          class="flex-1 justify-center sm:flex-none"
          :disabled="isLoading"
          @click="emit('close')"
        >
          Batal
        </UButton>
        <UButton
          type="submit"
          form="form-setoran-tabungan"
          class="flex-1 justify-center sm:flex-none"
          :loading="isLoading"
          :disabled="!ready"
        >
          Ajukan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
