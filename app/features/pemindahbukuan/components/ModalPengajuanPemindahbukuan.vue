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
import { useToastError, useToastSuccess } from "~/composables/toast";
import { extractErrorMessage } from "~/utils/error";
import { API_URL } from "~/constants";
import { getSaldoSimpananKey } from "~/features/simpanan/data";
import { getAnggotaOptions } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { refreshPemindahbukuanData } from "../data";
import {
  getPemindahbukuanLimit,
  getPemindahbukuanSchema,
  hargaNominalSaham,
  tipePemindahbukuanOptions,
} from "../model";
import PemilihTujuanPemindahbukuan from "./PemilihTujuanPemindahbukuan.vue";

const props = defineProps<{ refresh: () => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const canManage = computed(() => can(session.value.data?.user.role, "pemindahbukuan", "manage"));
const canDelegate = computed(() => can(session.value.data?.user.role, "inputSimpanan", "manage"));
const isLoading = ref(false);
const state = reactive({
  tipePemindahbukuan: "tabungan_ke_tabungan" as TipePemindahbukuan,
  idUserSumber: undefined as number | undefined,
  idUserTujuan: undefined as number | undefined,
  nominal: undefined as number | undefined,
  jumlahSaham: undefined as number | undefined,
  keterangan: "",
});
const conversion = computed(() => state.tipePemindahbukuan === "tabungan_ke_saham");
const shareTransfer = computed(() => state.tipePemindahbukuan === "saham_ke_saham");
const {
  data: sources,
  status: sourceStatus,
  error: sourceError,
  refresh: refreshSources,
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canManage,
  watch: [canManage],
});
const sourceOptions = computed(() => getAnggotaOptions(sources.value?.data ?? []));
const sourceMember = computed(() =>
  sources.value?.data.find((member) => member.id === state.idUserSumber),
);
watch(
  [sources, actorId],
  () => {
    if (
      state.idUserSumber === undefined &&
      sources.value?.data.some((member) => member.id === actorId.value && member.noAnggota?.trim())
    )
      state.idUserSumber = actorId.value;
  },
  { immediate: true },
);

const selectedDestination = ref<AnggotaSimpanan>();
watch(
  selectedDestination,
  (member) => {
    if (!conversion.value) state.idUserTujuan = member?.id;
  },
  { flush: "sync" },
);
const destinationMember = computed(() =>
  conversion.value ? sourceMember.value : selectedDestination.value,
);
watch(
  () => state.tipePemindahbukuan,
  () => {
    state.nominal = undefined;
    state.jumlahSaham = undefined;
    selectedDestination.value = undefined;
    state.idUserTujuan = conversion.value ? state.idUserSumber : undefined;
  },
);
watch(
  () => state.idUserSumber,
  (id) => {
    if (conversion.value) state.idUserTujuan = id;
    else if (selectedDestination.value?.id === id) selectedDestination.value = undefined;
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
const priceEnabled = computed(() => canManage.value && conversion.value);
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
const estimatedAmount = computed(() =>
  state.tipePemindahbukuan === "tabungan_ke_tabungan"
    ? (state.nominal ?? 0)
    : (state.jumlahSaham ?? 0) *
      (conversion.value ? (price.value?.hargaJual ?? 0) : hargaNominalSaham),
);
const availableAfter = computed(() =>
  shareTransfer.value
    ? Math.max(0, (balance.value?.jumlahSahamEfektif ?? 0) - (state.jumlahSaham ?? 0))
    : Math.max(0, (balance.value?.saldoEfektif ?? 0) - estimatedAmount.value),
);
const ready = computed(
  () =>
    canManage.value &&
    sourceStatus.value === "success" &&
    !!sourceMember.value?.noAnggota?.trim() &&
    !!destinationMember.value?.noAnggota?.trim() &&
    balanceStatus.value === "success" &&
    maxAmount.value > 0 &&
    (!conversion.value || priceStatus.value === "success"),
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
  await refreshPemindahbukuanData(
    [event.data.idUserSumber, event.data.idUserTujuan],
    props.refresh,
  );
}
</script>

<template>
  <UModal
    title="Ajukan pemindahbukuan"
    description="Pilih sumber dan tujuan, lalu isi nilai yang akan dipindahkan."
    :ui="{ content: 'sm:max-w-4xl' }"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-pemindahbukuan"
        :schema="schema"
        :state="state"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField label="Jenis Pemindahbukuan" name="tipePemindahbukuan" required>
          <USelect
            v-model="state.tipePemindahbukuan"
            :items="tipePemindahbukuanOptions"
            class="w-full"
          />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-3 border-t border-default pt-4">
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
            <UFormField label="Anggota Sumber" name="idUserSumber" required>
              <USelectMenu
                v-model="state.idUserSumber"
                :items="sourceOptions"
                value-key="value"
                placeholder="Pilih anggota sumber"
                :loading="sourceStatus === 'pending'"
                :disabled="!canDelegate || sourceStatus !== 'success' || isLoading"
                class="w-full"
              />
            </UFormField>
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
                {{ shareTransfer ? "Saham tersedia" : "Saldo tabungan tersedia" }}
              </p>
              <USkeleton v-if="balanceStatus === 'pending'" class="h-6 w-32" />
              <p v-else class="text-lg font-semibold tabular-nums">
                {{
                  balance
                    ? shareTransfer
                      ? `${balance.jumlahSahamEfektif.toLocaleString("id-ID")} lembar`
                      : formatRupiah(balance.saldoEfektif)
                    : "—"
                }}
              </p>
              <p v-if="balance" class="text-xs text-muted">
                {{
                  shareTransfer
                    ? `${balance.totalSahamPending.toLocaleString("id-ID")} lembar dicadangkan`
                    : `${formatRupiah(balance.totalPenarikanPending + balance.totalPemindahbukuanPending)} dicadangkan`
                }}
              </p>
            </template>
          </div>
          <PemilihTujuanPemindahbukuan
            v-model="selectedDestination"
            :source="sourceMember"
            :tipe="state.tipePemindahbukuan"
            :enabled="canManage"
            :disabled="isLoading"
          />
        </div>
        <UFormField
          v-if="state.tipePemindahbukuan === 'tabungan_ke_tabungan'"
          label="Nominal (Rp)"
          name="nominal"
          required
        >
          <UInputNumber
            v-model="state.nominal"
            :min="1"
            :max="Math.max(1, maxAmount)"
            :step="1"
            class="w-full"
          />
        </UFormField>
        <UFormField v-else label="Jumlah Saham (Lembar)" name="jumlahSaham" required>
          <UInputNumber
            v-model="state.jumlahSaham"
            :min="1"
            :max="Math.max(1, maxAmount)"
            :step="1"
            class="w-full"
          />
        </UFormField>
        <UAlert
          v-if="conversion && priceError"
          title="Harga Saham Belum Tersedia"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshPrice() }]"
        />
        <p v-else-if="conversion" class="text-sm text-muted">
          Harga jual per lembar:
          {{
            priceStatus === "pending" ? "Memuat..." : price ? formatRupiah(price.hargaJual) : "—"
          }}. Harga final ditetapkan saat pengajuan dan digunakan saat approval.
        </p>
        <UAlert
          v-if="
            balanceStatus === 'success' &&
            maxAmount === 0 &&
            (!conversion || priceStatus === 'success')
          "
          title="Saldo atau Saham Tidak Mencukupi"
          description="Tidak ada saldo atau saham tersedia untuk pengajuan ini."
          color="info"
          variant="subtle"
        />
        <UFormField label="Keterangan" name="keterangan">
          <UTextarea
            v-model="state.keterangan"
            placeholder="Keterangan pemindahbukuan (opsional)"
            class="w-full"
          />
        </UFormField>
        <div
          v-if="sourceMember && destinationMember && balanceStatus === 'success'"
          class="transaction-summary space-y-2"
          aria-live="polite"
        >
          <p class="font-medium">{{ sourceMember.name }} → {{ destinationMember.name }}</p>
          <p v-if="state.tipePemindahbukuan !== 'tabungan_ke_tabungan'">
            {{ (state.jumlahSaham ?? 0).toLocaleString("id-ID") }} lembar saham
            {{ conversion ? "diperoleh" : "dipindahkan" }}
          </p>
          <p>
            {{
              shareTransfer
                ? "Nilai referensi saham"
                : conversion
                  ? "Estimasi tabungan digunakan"
                  : "Tabungan dipindahkan"
            }}:
            <strong>{{
              conversion && priceStatus !== "success" ? "—" : formatRupiah(estimatedAmount)
            }}</strong>
          </p>
          <p v-if="!conversion || priceStatus === 'success'" class="text-sm text-muted">
            {{ shareTransfer ? "Saham tersedia" : "Saldo tersedia" }} sumber setelah diajukan:
            {{
              shareTransfer
                ? `${availableAfter.toLocaleString("id-ID")} lembar`
                : formatRupiah(availableAfter)
            }}.
          </p>
        </div>
        <p class="text-sm text-muted">
          Pengajuan menunggu persetujuan admin. Saldo atau saham sumber dicadangkan selama pending
          dan dilepas jika pengajuan ditolak atau dibatalkan.
        </p>
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
          Ajukan pemindahbukuan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
