<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { PengajuanPemindahbukuan, TipePemindahbukuan } from "../model";
import type {
  AnggotaOptionsResponse,
  AnggotaSimpanan,
  HargaSaham,
  SaldoSimpanan,
} from "~/features/simpanan/model";
import { useApi } from "~/composables/fetch";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { getSaldoSimpananKey } from "~/features/simpanan/data";
import { getAnggotaOptions } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import {
  getPemindahbukuanLimit,
  getPemindahbukuanOptions,
  getPemindahbukuanSchema,
} from "../model";
import PemilihTujuanPemindahbukuan from "./PemilihTujuanPemindahbukuan.vue";

const props = defineProps<{ refresh: (userIds: number[]) => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const canManage = computed(() => can(session.value.data?.user.role, "pemindahbukuan", "manage"));
const canDelegate = computed(() => can(session.value.data?.user.role, "inputSimpanan", "manage"));
const canBuyback = computed(() =>
  can(session.value.data?.user.role, "approvalPemindahbukuan", "manage"),
);
const tipeOptions = computed(() => getPemindahbukuanOptions(canBuyback.value));
const isLoading = ref(false);
const state = reactive({
  tipePemindahbukuan: "tabungan_ke_tabungan" as TipePemindahbukuan,
  idUserSumber: actorId.value as number | undefined,
  nominal: undefined as number | undefined,
  jumlahSaham: undefined as number | undefined,
  keterangan: "",
});
const conversion = computed(() => state.tipePemindahbukuan === "tabungan_ke_saham");
const shareTransfer = computed(() => state.tipePemindahbukuan === "saham_ke_saham");
const buyback = computed(() => state.tipePemindahbukuan === "pembelian_kembali_saham");
const needsPrice = computed(() => conversion.value || buyback.value);
watch(canBuyback, (allowed) => {
  if (!allowed && buyback.value) state.tipePemindahbukuan = "tabungan_ke_tabungan";
});
const {
  data: sources,
  status: sourceStatus,
  error: sourceError,
  refresh: refreshSources,
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canManage,
  watch: [canManage],
});
const sourceOptions = computed(() => {
  const options = getAnggotaOptions(sources.value?.data ?? []).map((option) =>
    option.value === actorId.value ? { ...option, label: `${option.label} (Saya)` } : option,
  );
  if (options.some((option) => option.value === actorId.value)) return options;
  return [
    {
      label: `${session.value.data?.user.name ?? "Saya"} (Saya)`,
      value: actorId.value,
      disabled: true,
    },
    ...options,
  ];
});
const selectedSourceId = computed({
  get: () => state.idUserSumber,
  set: (id: number | undefined) => {
    if (
      canDelegate.value &&
      !isLoading.value &&
      sourceOptions.value.some((option) => option.value === id && !option.disabled)
    ) {
      state.idUserSumber = id;
    }
  },
});
const sourceMember = computed(() =>
  sources.value?.data.find((member) => member.id === state.idUserSumber),
);
watch(
  [actorId, canDelegate],
  () => {
    state.idUserSumber = actorId.value;
  },
  { flush: "sync" },
);

const selectedDestination = ref<AnggotaSimpanan>();
const destinationMember = computed(() =>
  conversion.value ? sourceMember.value : selectedDestination.value,
);
const formState = computed(() => ({
  ...state,
  idUserTujuan: destinationMember.value?.id,
}));
watch(
  () => state.tipePemindahbukuan,
  () => {
    state.nominal = undefined;
    state.jumlahSaham = undefined;
    selectedDestination.value = undefined;
  },
);
watch(
  () => state.idUserSumber,
  (id) => {
    if (selectedDestination.value?.id === id) selectedDestination.value = undefined;
  },
);

const balanceEnabled = computed(() => canManage.value && !!sourceMember.value?.noAnggota?.trim());
const {
  data: balance,
  status: balanceStatus,
  error: balanceError,
  refresh: refreshBalance,
} = useApi<SaldoSimpanan>("/api/v1/simpanan/saldo", {
  key: computed(() => getSaldoSimpananKey(state.idUserSumber ?? 0)),
  query: { userId: computed(() => state.idUserSumber) },
  enabled: balanceEnabled,
  watch: [balanceEnabled],
});
const priceEnabled = computed(() => canManage.value && needsPrice.value);
const {
  data: price,
  status: priceStatus,
  error: priceError,
  refresh: refreshPrice,
} = useApi<HargaSaham>("/api/v1/master-saham/latest", {
  enabled: priceEnabled,
  watch: [priceEnabled],
});
const schema = computed(() => getPemindahbukuanSchema(balance.value, price.value));
const maxAmount = computed(() =>
  getPemindahbukuanLimit(state.tipePemindahbukuan, balance.value, price.value),
);
const ready = computed(
  () =>
    canManage.value &&
    (!buyback.value || canBuyback.value) &&
    sourceStatus.value === "success" &&
    !!sourceMember.value?.noAnggota?.trim() &&
    (buyback.value || !!destinationMember.value?.noAnggota?.trim()) &&
    balanceStatus.value === "success" &&
    maxAmount.value > 0 &&
    (!needsPrice.value || priceStatus.value === "success"),
);

async function onSubmit(event: FormSubmitEvent<PengajuanPemindahbukuan>) {
  if (isLoading.value || !ready.value) return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/pemindahbukuan", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: event.data,
    });
  } catch (error) {
    useToastError(
      "Gagal Mengajukan Pemindahbukuan",
      extractErrorMessage(error, "Pengajuan gagal disimpan. Silakan coba lagi."),
    );
    isLoading.value = false;
    return;
  }
  useToastSuccess("Pemindahbukuan Berhasil Diajukan", "Pengajuan menunggu persetujuan admin.");
  emit("close");
  await props.refresh(
    event.data.tipePemindahbukuan === "pembelian_kembali_saham"
      ? [event.data.idUserSumber]
      : [event.data.idUserSumber, event.data.idUserTujuan],
  );
}
</script>

<template>
  <UModal
    title="Ajukan Pemindahbukuan"
    description="Pindahkan simpanan berdasarkan saldo atau saham yang tersedia."
    :ui="{ content: 'sm:max-w-4xl' }"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-pemindahbukuan"
        :schema="schema"
        :state="formState"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField label="Jenis Pemindahbukuan" name="tipePemindahbukuan" required>
          <USelect v-model="state.tipePemindahbukuan" :items="tipeOptions" class="w-full" />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-3 rounded-lg border border-default p-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-medium text-highlighted">Sumber</h3>
              <UButton
                v-if="balanceEnabled"
                icon="i-tabler-refresh"
                color="neutral"
                variant="ghost"
                size="xs"
                :loading="balanceStatus === 'pending'"
                :disabled="isLoading"
                aria-label="Muat ulang saldo sumber"
                @click="() => refreshBalance()"
              />
            </div>
            <UFormField v-if="canDelegate" label="Anggota Sumber" name="idUserSumber" required>
              <USelectMenu
                v-model="selectedSourceId"
                :items="sourceOptions"
                value-key="value"
                placeholder="Pilih anggota sumber"
                :loading="sourceStatus === 'pending'"
                :disabled="sourceStatus !== 'success' || isLoading"
                class="w-full"
              />
            </UFormField>
            <p v-else class="font-medium">{{ session.data?.user.name ?? "Saya" }} (Saya)</p>
            <UAlert
              v-if="sourceError"
              title="Gagal Memuat Anggota Sumber"
              color="error"
              variant="subtle"
              :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshSources() }]"
            />
            <UAlert
              v-else-if="
                sourceStatus === 'success' && !sourceOptions.some((option) => !option.disabled)
              "
              title="Anggota Sumber Belum Tersedia"
              description="Sumber pemindahbukuan harus memiliki nomor anggota."
              color="info"
              variant="subtle"
            />
            <UAlert
              v-if="balanceError"
              title="Gagal Memuat Saldo Sumber"
              color="error"
              variant="subtle"
              :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshBalance() }]"
            />
            <template v-else-if="sourceMember">
              <p class="text-sm text-muted">
                {{ shareTransfer || buyback ? "Saham tersedia" : "Saldo tabungan tersedia" }}
              </p>
              <USkeleton v-if="balanceStatus === 'pending'" class="h-6 w-32" />
              <p v-else class="text-lg font-semibold">
                {{
                  balance
                    ? shareTransfer || buyback
                      ? `${balance.jumlahSahamEfektif.toLocaleString("id-ID")} lembar`
                      : formatRupiah(balance.saldoEfektif)
                    : "—"
                }}
              </p>
            </template>
          </div>
          <UFormField v-if="buyback" label="Pembayaran melalui">
            <UInput model-value="Bank BSI" readonly class="w-full" />
          </UFormField>
          <PemilihTujuanPemindahbukuan
            v-else
            v-model="selectedDestination"
            :source="sourceMember"
            :tipe="state.tipePemindahbukuan"
            :enabled="canManage"
            :disabled="isLoading"
          />
        </div>
        <UFormField
          v-if="state.tipePemindahbukuan === 'tabungan_ke_tabungan'"
          label="Nominal"
          name="nominal"
          required
        >
          <UInputNumber
            v-model="state.nominal"
            :min="1"
            :max="Math.max(1, maxAmount)"
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
        <UFormField v-else label="Jumlah Saham (Lembar)" name="jumlahSaham" required>
          <UInputNumber
            v-model="state.jumlahSaham"
            :min="buyback ? 0.5 : 1"
            :max="Math.max(buyback ? 0.5 : 1, maxAmount)"
            :step="buyback ? 0.5 : 1"
            :format-options="{ maximumFractionDigits: buyback ? 1 : 0 }"
            locale="id-ID"
            class="w-full"
          />
        </UFormField>
        <UAlert
          v-if="needsPrice && priceError"
          title="Harga Saham Belum Tersedia"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshPrice() }]"
        />
        <p v-else-if="needsPrice" class="text-sm text-muted">
          Harga jual per lembar:
          {{
            priceStatus === "pending" ? "Memuat..." : price ? formatRupiah(price.hargaJual) : "—"
          }}. Harga final ditetapkan saat pengajuan dan digunakan saat approval.
        </p>
        <p
          v-if="buyback && priceStatus === 'success' && price && state.jumlahSaham"
          class="font-semibold"
        >
          Estimasi pembayaran: {{ formatRupiah(state.jumlahSaham * price.hargaJual) }}
        </p>
        <UAlert
          v-if="
            balanceStatus === 'success' &&
            maxAmount === 0 &&
            (!needsPrice || priceStatus === 'success')
          "
          title="Saldo atau Saham Tidak Mencukupi"
          description="Tidak ada saldo atau saham tersedia untuk pengajuan ini."
          color="info"
          variant="subtle"
        />
        <UFormField label="Keterangan" name="keterangan">
          <UTextarea
            v-model="state.keterangan"
            placeholder="Tambahkan keterangan (opsional)"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton
          type="submit"
          form="form-pemindahbukuan"
          icon="i-tabler-send"
          :loading="isLoading"
          :disabled="!ready"
        >
          Ajukan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
