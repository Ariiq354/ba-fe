<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { JurnalAkun, JurnalAkunResponse, JurnalSchema } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { formatRupiah } from "~/utils/format";
import { getJurnalTotals, initJurnalFormdata, jurnalSchema, maxJurnalAmount } from "../model";

const props = defineProps<{ refresh: () => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const state = reactive(initJurnalFormdata());
const isLoading = ref(false);
let nextRowKey = 2;

const {
  data: akun,
  status: akunStatus,
  error: akunError,
  refresh: refreshAkun,
} = useAsyncData("jurnal-akun-options", async () => {
  const accounts: JurnalAkun[] = [];
  const limit = 100;
  let page = 1;
  let total = 0;
  do {
    const response = await $fetch<JurnalAkunResponse>("/api/v1/master-akun", {
      baseURL: API_URL,
      credentials: "include",
      query: { page, limit, search: "", kategori: "all" },
    });
    accounts.push(...response.data);
    total = response.total;
    page++;
    if (!response.data.length) break;
  } while (accounts.length < total);
  return accounts
    .filter((account) => account.isActive)
    .map((account) => ({
      label: `${account.kodeAkun} · ${account.namaAkun}`,
      value: account.id,
    }));
});

const totals = computed(() => getJurnalTotals(state.details));
const isBalanced = computed(
  () => totals.value.debit > 0 && totals.value.debit === totals.value.kredit,
);
const accountsReady = computed(() => akunStatus.value === "success" && !!akun.value?.length);

function addRow() {
  state.details.push({ key: nextRowKey++, akunId: undefined, debit: 0, kredit: 0 });
}

async function onSubmit(event: FormSubmitEvent<JurnalSchema>) {
  if (isLoading.value || !accountsReady.value) return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/jurnal", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: event.data,
    });
  } catch (error) {
    useToastError(
      "Gagal Menyimpan Jurnal",
      extractErrorMessage(error, "Jurnal gagal disimpan. Silakan coba lagi."),
    );
    isLoading.value = false;
    return;
  }
  useToastSuccess("Jurnal Berhasil Ditambahkan", "Pencatatan debit dan kredit telah disimpan.");
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    title="Tambah Jurnal"
    :ui="{ content: 'sm:max-w-4xl' }"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-jurnal"
        :schema="jurnalSchema"
        :state="state"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField label="Tanggal Transaksi" name="tanggalTransaksi" required>
          <UInput v-model="state.tanggalTransaksi" type="date" class="w-full" />
        </UFormField>
        <UFormField label="Keterangan" name="keterangan">
          <UTextarea
            v-model="state.keterangan"
            placeholder="Tambahkan keterangan (opsional)"
            :rows="2"
            :maxrows="4"
            autoresize
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="akunError"
          title="Gagal Memuat Akun"
          description="Daftar akun belum dapat dimuat. Silakan coba lagi."
          color="error"
          variant="subtle"
          :actions="[
            {
              label: 'Coba lagi',
              color: 'error',
              variant: 'outline',
              onClick: () => refreshAkun(),
            },
          ]"
        />
        <UAlert
          v-else-if="akunStatus === 'success' && !akun?.length"
          title="Belum Ada Akun Aktif"
          description="Tambahkan atau aktifkan akun di Master Akun sebelum mencatat jurnal."
          color="info"
          variant="subtle"
        />

        <UFormField label="Rincian Akun" name="details" required>
          <div class="space-y-3">
            <div
              v-for="(detail, index) in state.details"
              :key="detail.key"
              class="grid grid-cols-2 gap-3 border-t border-default pt-4 first:border-t-0 first:pt-0 sm:grid-cols-12"
            >
              <UFormField
                :label="`Akun ${index + 1}`"
                :name="`details.${index}.akunId`"
                class="col-span-2 sm:col-span-5"
                required
              >
                <USelectMenu
                  v-model="detail.akunId"
                  :items="akun ?? []"
                  value-key="value"
                  placeholder="Pilih akun aktif"
                  :loading="akunStatus === 'pending'"
                  :disabled="!accountsReady || isLoading"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Debit"
                :name="`details.${index}.debit`"
                class="sm:col-span-3"
                required
              >
                <UInputNumber
                  v-model="detail.debit"
                  :min="0"
                  :max="maxJurnalAmount"
                  :step="1"
                  :increment="false"
                  :decrement="false"
                  :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }"
                  locale="id-ID"
                  placeholder="Rp 0"
                  disable-wheel-change
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="Kredit"
                :name="`details.${index}.kredit`"
                class="sm:col-span-3"
                required
              >
                <UInputNumber
                  v-model="detail.kredit"
                  :min="0"
                  :max="maxJurnalAmount"
                  :step="1"
                  :increment="false"
                  :decrement="false"
                  :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }"
                  locale="id-ID"
                  placeholder="Rp 0"
                  disable-wheel-change
                  class="w-full"
                />
              </UFormField>
              <div class="col-span-2 flex items-end justify-end sm:col-span-1">
                <UButton
                  icon="i-tabler-trash"
                  color="error"
                  variant="ghost"
                  :aria-label="`Hapus baris ${index + 1}`"
                  :disabled="isLoading || state.details.length <= 2"
                  @click="state.details.splice(index, 1)"
                />
              </div>
            </div>
            <UButton
              icon="i-tabler-plus"
              color="neutral"
              variant="outline"
              :disabled="isLoading"
              @click="addRow"
            >
              Tambah Baris
            </UButton>
          </div>
        </UFormField>

        <div class="space-y-3 border-t border-default pt-4" aria-live="polite">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-sm text-muted">Total Debit</p>
              <p class="font-semibold text-highlighted tabular-nums">
                {{ formatRupiah(totals.debit) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-muted">Total Kredit</p>
              <p class="font-semibold text-highlighted tabular-nums">
                {{ formatRupiah(totals.kredit) }}
              </p>
            </div>
          </div>
          <UBadge :color="isBalanced ? 'success' : 'warning'" variant="subtle">
            {{
              isBalanced
                ? "Seimbang"
                : totals.debit === totals.kredit
                  ? "Total harus lebih dari nol"
                  : `Selisih ${formatRupiah(Math.abs(totals.debit - totals.kredit))}`
            }}
          </UBadge>
        </div>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton
          type="submit"
          form="form-jurnal"
          icon="i-tabler-check"
          :loading="isLoading"
          :disabled="!accountsReady"
        >
          Simpan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
