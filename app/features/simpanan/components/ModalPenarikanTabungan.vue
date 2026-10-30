<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { PenarikanTabungan, SaldoSimpanan } from "../model";
import { useApi } from "~/composables/fetch";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { APPROVAL_SIMPANAN_PENDING_KEY, getSaldoSimpananKey } from "../data";
import { maxSimpananAmount, paymentMethodOptions, penarikanSchema } from "../model";

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
  metodePembayaran: undefined as PenarikanTabungan["metodePembayaran"] | undefined,
  nilaiTransaksi: undefined as number | undefined,
  keterangan: "",
});
const {
  data: balance,
  status: balanceStatus,
  error: balanceError,
  refresh: refreshBalance,
} = useApi<SaldoSimpanan>("/api/v1/simpanan/saldo", {
  key: getSaldoSimpananKey(props.userId),
  query: { userId: props.userId },
  watch: false,
});
const schema = computed(() => {
  const currentBalance = balance.value;
  return penarikanSchema.refine(
    (data) => !!currentBalance && data.nilaiTransaksi <= currentBalance.saldoEfektif,
    {
      path: ["nilaiTransaksi"],
      message: "Nominal melebihi saldo efektif atau saldo belum tersedia",
    },
  );
});
const maxAmount = computed(() =>
  balance.value
    ? Math.max(1, Math.min(balance.value.saldoEfektif, maxSimpananAmount))
    : maxSimpananAmount,
);
const insufficientBalance = computed(
  () => balanceStatus.value === "success" && !!balance.value && balance.value.saldoEfektif <= 0,
);
const ready = computed(
  () =>
    canManage.value &&
    !!state.metodePembayaran &&
    balanceStatus.value === "success" &&
    !!balance.value &&
    balance.value.saldoEfektif > 0,
);

async function onSubmit(event: FormSubmitEvent<PenarikanTabungan>) {
  if (isLoading.value || !ready.value) return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/simpanan/mutasi/penarikan", {
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
    title="Tarik Tabungan"
    :description="`Untuk ${memberName}`"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-penarikan-tabungan"
        :schema="schema"
        :state="state"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField label="Nominal penarikan" name="nilaiTransaksi" required>
          <UInputNumber
            v-model="state.nilaiTransaksi"
            :min="1"
            :max="maxAmount"
            :disabled="isLoading || balance?.saldoEfektif === 0"
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
        <UFormField label="Metode penarikan" name="metodePembayaran" required>
          <USelectMenu
            v-model="state.metodePembayaran"
            :items="paymentMethodOptions"
            value-key="value"
            placeholder="Pilih metode penarikan"
            :search-input="false"
            class="w-full"
          />
        </UFormField>
        <div class="space-y-3">
          <UAlert
            v-if="balanceError"
            title="Saldo belum dapat dimuat"
            color="error"
            variant="subtle"
            :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshBalance() }]"
          />
          <div v-else class="flex items-center justify-between gap-4 text-sm" aria-live="polite">
            <span class="text-muted">Saldo tersedia</span>
            <USkeleton v-if="balanceStatus === 'pending'" class="h-5 w-28" />
            <span v-else class="font-medium tabular-nums">
              {{ balance ? formatRupiah(balance.saldoEfektif) : "—" }}
            </span>
          </div>
          <UAlert
            v-if="!balanceError && insufficientBalance"
            title="Saldo tidak mencukupi"
            description="Belum ada saldo yang bisa ditarik."
            color="warning"
            variant="subtle"
          />
        </div>
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
          form="form-penarikan-tabungan"
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
