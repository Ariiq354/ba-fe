<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { HargaSaham, PembelianSaham, SaldoSimpanan } from "../model";
import { useApi } from "~/composables/fetch";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import {
  PEMINDAHBUKUAN_APPROVAL_LIST_KEY,
  PEMINDAHBUKUAN_LIST_KEY,
  refreshPemindahbukuanData,
} from "~/features/pemindahbukuan/data";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { APPROVAL_SIMPANAN_PENDING_KEY, getSaldoSimpananKey } from "../data";
import { maxSimpananAmount, setoranSahamSchema, sharePaymentMethodOptions } from "../model";

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
  metodePembayaran: undefined as PembelianSaham["metodePembayaran"] | undefined,
  jumlahSaham: undefined as number | undefined,
  keterangan: "",
});
const usesTabungan = computed(() => state.metodePembayaran === "Tabungan");
const {
  data: price,
  status: priceStatus,
  error: priceError,
  refresh: refreshPrice,
} = useApi<HargaSaham>("/api/v1/master-saham/latest", {
  watch: false,
});
const {
  data: balance,
  status: balanceStatus,
  error: balanceError,
  refresh: refreshBalance,
} = useApi<SaldoSimpanan>("/api/v1/simpanan/saldo", {
  key: getSaldoSimpananKey(props.userId),
  query: { userId: props.userId },
  enabled: usesTabungan,
  watch: [usesTabungan],
});
const estimatedTotal = computed(() => (state.jumlahSaham ?? 0) * (price.value?.hargaJual ?? 0));
const maxShares = computed(() => {
  const currentPrice = price.value;
  if (!currentPrice || currentPrice.hargaJual <= 0 || currentPrice.hargaNominal <= 0) return 0;

  const transactionLimit = Math.min(
    Math.floor(maxSimpananAmount / currentPrice.hargaJual),
    Math.floor(maxSimpananAmount / currentPrice.hargaNominal),
  );
  if (!usesTabungan.value) return transactionLimit;

  const affordableShares = Math.floor((balance.value?.saldoEfektif ?? 0) / currentPrice.hargaJual);
  return Math.max(0, Math.min(transactionLimit, affordableShares));
});
const schema = computed(() => {
  const currentPrice = price.value;
  const currentBalance = balance.value;
  return setoranSahamSchema
    .refine(
      (data) =>
        !!currentPrice &&
        data.jumlahSaham * currentPrice.hargaJual <= maxSimpananAmount &&
        data.jumlahSaham * currentPrice.hargaNominal <= maxSimpananAmount,
      {
        path: ["jumlahSaham"],
        message: "Total transaksi saham melebihi batas yang diizinkan atau harga belum tersedia",
      },
    )
    .refine(
      (data) =>
        data.metodePembayaran !== "Tabungan" ||
        (!!currentPrice &&
          !!currentBalance &&
          data.jumlahSaham * currentPrice.hargaJual <= currentBalance.saldoEfektif),
      {
        path: ["jumlahSaham"],
        message: "Total pembelian melebihi saldo efektif atau saldo belum tersedia",
      },
    );
});
const insufficientBalance = computed(() => {
  if (balanceStatus.value !== "success" || !balance.value) return false;
  if (balance.value.saldoEfektif <= 0) return true;
  return priceStatus.value === "success" && maxShares.value === 0;
});
const ready = computed(() => {
  if (!canManage.value || !state.metodePembayaran) return false;
  if (priceStatus.value !== "success" || maxShares.value <= 0) return false;
  if (usesTabungan.value)
    return balanceStatus.value === "success" && !!balance.value && balance.value.saldoEfektif > 0;
  return true;
});

async function onSubmit(event: FormSubmitEvent<PembelianSaham>) {
  if (isLoading.value || !ready.value) return;
  isLoading.value = true;
  const paidFromTabungan = event.data.metodePembayaran === "Tabungan";
  try {
    await $fetch("/api/v1/simpanan/mutasi/setoran/saham", {
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
  useToastSuccess(
    "Pengajuan Berhasil",
    paidFromTabungan
      ? "Pembelian saham menunggu persetujuan admin di Pemindahbukuan."
      : "Transaksi menunggu persetujuan admin.",
  );
  emit("close");
  if (paidFromTabungan) {
    await Promise.all([
      refreshPemindahbukuanData([props.userId], props.refresh),
      refreshNuxtData([PEMINDAHBUKUAN_LIST_KEY, PEMINDAHBUKUAN_APPROVAL_LIST_KEY]),
    ]);
  } else {
    await Promise.all([props.refresh(), refreshNuxtData(APPROVAL_SIMPANAN_PENDING_KEY)]);
  }
}
</script>

<template>
  <UModal
    title="Beli Saham"
    :description="`Untuk ${memberName}`"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-pembelian-saham"
        :schema="schema"
        :state="state"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UAlert
          v-if="priceError"
          title="Harga saham belum tersedia"
          description="Coba muat ulang harga saham terbaru."
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshPrice() }]"
        />
        <UFormField label="Jumlah saham" name="jumlahSaham" hint="Lembar" required>
          <UInputNumber
            v-model="state.jumlahSaham"
            :min="1"
            :max="Math.max(1, maxShares)"
            :step="1"
            locale="id-ID"
            placeholder="0"
            size="xl"
            disable-wheel-change
            :ui="{ base: 'font-medium tabular-nums' }"
            class="w-full"
          />
          <template #help>
            <USkeleton v-if="priceStatus === 'pending'" class="h-4 w-40" />
            <span v-else-if="price">{{ formatRupiah(price.hargaJual) }} per lembar</span>
          </template>
        </UFormField>
        <UFormField label="Metode pembayaran" name="metodePembayaran" required>
          <USelectMenu
            v-model="state.metodePembayaran"
            :items="sharePaymentMethodOptions"
            value-key="value"
            placeholder="Pilih metode pembayaran"
            :search-input="false"
            class="w-full"
          />
        </UFormField>
        <div v-if="usesTabungan" class="space-y-3">
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
            description="Saldo tersedia belum cukup untuk membeli satu lembar saham."
            color="warning"
            variant="subtle"
          />
        </div>
        <div v-if="price" class="space-y-3 rounded-lg bg-muted/50 p-4" aria-live="polite">
          <dl class="space-y-3">
            <div class="flex items-center justify-between gap-4">
              <dt class="text-sm text-muted">Estimasi pembelian</dt>
              <dd class="text-lg font-semibold tabular-nums">{{ formatRupiah(estimatedTotal) }}</dd>
            </div>
            <div
              v-if="usesTabungan && balanceStatus === 'success' && balance"
              class="flex items-center justify-between gap-4 border-t border-default pt-3 text-sm"
            >
              <dt class="text-muted">Sisa saldo setelah pengajuan</dt>
              <dd class="font-medium tabular-nums">
                {{ formatRupiah(balance.saldoEfektif - estimatedTotal) }}
              </dd>
            </div>
          </dl>
          <p class="text-xs text-muted">Harga final mengikuti harga saat pengajuan disimpan.</p>
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
          form="form-pembelian-saham"
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
