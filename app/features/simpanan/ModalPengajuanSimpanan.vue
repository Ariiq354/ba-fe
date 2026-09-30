<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { HargaSaham, JenisPengajuan, PaymentAccountsResponse, PengajuanSimpanan, SaldoSimpanan } from "./model";
import { useApi } from "~/composables/fetch";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { getPengajuanSchema, maxSimpananAmount, pengajuanLabels } from "./model";

const props = defineProps<{
  userId: number;
  memberName: string;
  jenis: JenisPengajuan;
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
  jenisSimpanan: props.jenis === "saham" ? "saham" as const : "tabungan" as const,
  akunId: undefined as number | undefined,
  nilaiTransaksi: undefined as number | undefined,
  jumlahSaham: undefined as number | undefined,
  keterangan: "",
});

const { data: accounts, status: accountStatus, error: accountError, refresh: refreshAccounts } = useApi<PaymentAccountsResponse>("/api/v1/simpanan/akun-pembayaran/options");
const accountOptions = computed(() => accounts.value?.data.map(account => ({ label: `${account.kodeAkun} · ${account.namaAkun}`, value: account.id })) ?? []);
const { data: price, status: priceStatus, error: priceError, refresh: refreshPrice } = useApi<HargaSaham>("/api/v1/master-saham/latest", { immediate: props.jenis === "saham", watch: false });
const { data: balance, status: balanceStatus, error: balanceError, refresh: refreshBalance } = useApi<SaldoSimpanan>("/api/v1/simpanan/saldo", {
  query: { userId: props.userId },
  immediate: props.jenis === "penarikan",
  watch: false,
});

const estimatedTotal = computed(() => (state.jumlahSaham ?? 0) * (price.value?.hargaJual ?? 0));
const schema = computed(() => getPengajuanSchema(props.jenis, price.value, balance.value));
const ready = computed(() => canManage.value && accountStatus.value === "success" && accountOptions.value.length > 0
  && (props.jenis !== "saham" || (priceStatus.value === "success" && !!price.value))
  && (props.jenis !== "penarikan" || (balanceStatus.value === "success" && !!balance.value && balance.value.saldoEfektif > 0)));

async function onSubmit(event: FormSubmitEvent<PengajuanSimpanan>) {
  if (isLoading.value || !ready.value)
    return;
  isLoading.value = true;
  try {
    await $fetch(`/api/v1/simpanan/mutasi/${props.jenis === "penarikan" ? "penarikan" : "setoran"}`, {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: event.data,
    });
  }
  catch (error) {
    useToastError("Gagal Mengajukan Transaksi", extractErrorMessage(error, "Pengajuan gagal disimpan. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }
  useToastSuccess("Pengajuan Berhasil", "Transaksi menunggu persetujuan admin.");
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal :title="pengajuanLabels[jenis].title" :description="`Pengajuan untuk ${memberName}.`" :dismissible="!isLoading" :close="isLoading ? false : { onClick: () => emit('close') }">
    <template #body>
      <UForm id="form-pengajuan-simpanan" :schema="schema" :state="state" :disabled="isLoading" class="space-y-4" @submit="onSubmit">
        <UAlert v-if="accountError" title="Gagal Memuat Kas / Bank" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshAccounts() }]" />
        <UAlert v-else-if="accountStatus === 'success' && !accountOptions.length" title="Belum Ada Kas / Bank Aktif" description="Hubungi admin untuk mengaktifkan akun pembayaran." color="info" variant="subtle" />
        <UFormField label="Kas / Bank" name="akunId" required>
          <USelectMenu v-model="state.akunId" :items="accountOptions" value-key="value" placeholder="Pilih kas atau bank" :loading="accountStatus === 'pending'" :disabled="isLoading || accountStatus !== 'success'" class="w-full" />
        </UFormField>

        <template v-if="jenis === 'saham'">
          <UAlert v-if="priceError" title="Harga Saham Belum Tersedia" description="Harga saham terbaru belum dapat dimuat. Silakan coba lagi." color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshPrice() }]" />
          <p v-else class="text-sm text-muted">
            Harga per saham: {{ priceStatus === 'pending' ? 'Memuat...' : price ? formatRupiah(price.hargaJual) : '—' }}
          </p>
          <UFormField label="Jumlah Saham (Lembar)" name="jumlahSaham" required>
            <UInputNumber v-model="state.jumlahSaham" :min="1" :max="maxSimpananAmount" :step="1" class="w-full" />
          </UFormField>
          <div v-if="price" class="rounded-lg bg-elevated p-4" aria-live="polite">
            <p class="text-sm text-muted">
              Estimasi Total Pembelian
            </p>
            <p class="text-xl font-semibold">
              {{ formatRupiah(estimatedTotal) }}
            </p>
            <p class="mt-1 text-xs text-muted">
              Nilai akhir mengikuti harga terbaru saat pengajuan disimpan.
            </p>
          </div>
        </template>
        <template v-else>
          <template v-if="jenis === 'penarikan'">
            <UAlert v-if="balanceError" title="Gagal Memuat Saldo Anggota" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshBalance() }]" />
            <UAlert v-else-if="balanceStatus === 'success' && balance?.saldoEfektif === 0" title="Saldo Efektif Tidak Mencukupi" description="Anggota belum memiliki saldo yang tersedia untuk penarikan." color="info" variant="subtle" />
            <p v-else class="text-sm text-muted">
              Saldo efektif: {{ balanceStatus === 'pending' ? 'Memuat...' : balance ? formatRupiah(balance.saldoEfektif) : '—' }}
            </p>
          </template>
          <UFormField label="Nominal (Rp)" name="nilaiTransaksi" required>
            <UInputNumber v-model="state.nilaiTransaksi" :min="1" :max="jenis === 'penarikan' && balance ? Math.max(1, Math.min(balance.saldoEfektif, maxSimpananAmount)) : maxSimpananAmount" :disabled="isLoading || (jenis === 'penarikan' && balance?.saldoEfektif === 0)" :step="1" class="w-full" />
          </UFormField>
        </template>
        <UFormField label="Keterangan" name="keterangan">
          <UTextarea v-model="state.keterangan" placeholder="Keterangan transaksi (opsional)" class="w-full" />
        </UFormField>
        <p class="text-sm text-muted">
          Transaksi akan diproses setelah mendapat persetujuan admin.
        </p>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton type="submit" form="form-pengajuan-simpanan" icon="i-tabler-send" :loading="isLoading" :disabled="!ready">
          Ajukan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
