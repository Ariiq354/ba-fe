<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { PengajuanPembiayaan, SimulasiMarginResponse } from "../model";
import type { AnggotaOptionsResponse } from "~/features/simpanan/model";
import { useDebounceFn } from "#imports";
import { useApi } from "~/composables/fetch";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { getAnggotaOptions, paymentMethodOptions } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import { refreshPembiayaanData } from "../data";
import { maxPembiayaanAmount, pembiayaanSchema } from "../model";

const props = defineProps<{ refresh: () => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const isAdmin = computed(() => session.value.data?.user.role === "admin");
const actorId = computed(() => Number(session.value.data?.user.id));
const canManage = computed(() => can(session.value.data?.user.role, "pembiayaan", "manage"));
const canDelegate = computed(() => can(session.value.data?.user.role, "pembiayaan", "delegate"));
const canOverride = computed(() =>
  can(session.value.data?.user.role, "approvalPembiayaan", "manage"),
);
const isLoading = ref(false);
const overrideMargin = ref(false);
const customMarginActive = computed(() => canOverride.value && overrideMargin.value);
const simulasiMargin = ref<SimulasiMarginResponse>();
const simulasiLoading = ref(false);
const simulasiError = ref("");
const simulasiRefresh = ref(0);
const state = reactive({
  userId: actorId.value,
  jumlahPokok: undefined as number | undefined,
  jangkaWaktuBulan: undefined as number | undefined,
  tujuan: "",
  metodePembayaran: "Transfer" as PengajuanPembiayaan["metodePembayaran"],
  persenMarginTahun: undefined as number | undefined,
});
const {
  data: members,
  status: membersStatus,
  error: membersError,
  refresh: refreshMembers,
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canManage,
  watch: [canManage],
});
const memberOptions = computed(() =>
  getAnggotaOptions(members.value?.data ?? []).map((option) =>
    option.value === actorId.value ? { ...option, label: `${option.label} (Saya)` } : option,
  ),
);
watch(
  [actorId, canDelegate],
  () => {
    state.userId = actorId.value;
  },
  { flush: "sync" },
);
watch(
  [overrideMargin, canOverride],
  () => {
    state.persenMarginTahun = customMarginActive.value
      ? (state.persenMarginTahun ?? simulasiMargin.value?.persenMarginTahun)
      : undefined;
  },
  { flush: "sync" },
);
const persenMargin = computed({
  get: () =>
    customMarginActive.value ? state.persenMarginTahun : simulasiMargin.value?.persenMarginTahun,
  set: (value: number | undefined) => {
    if (customMarginActive.value) state.persenMarginTahun = value;
  },
});
const simulasiSchema = pembiayaanSchema
  .pick({ jumlahPokok: true, jangkaWaktuBulan: true, persenMarginTahun: true })
  .partial({ jangkaWaktuBulan: true });
const fetchSimulasiMargin = useDebounceFn(
  async (body: ReturnType<typeof simulasiSchema.parse>, signal: AbortSignal) => {
    try {
      const result = await $fetch<SimulasiMarginResponse>("/api/v1/pembiayaan/simulasi-margin", {
        baseURL: API_URL,
        method: "POST",
        credentials: "include",
        body,
        signal,
        retry: 0,
      });
      if (!signal.aborted) simulasiMargin.value = result;
    } catch (error) {
      if (!signal.aborted) {
        simulasiError.value = extractErrorMessage(
          error,
          "Simulasi margin belum dapat dimuat. Silakan coba lagi.",
        );
      }
    } finally {
      if (!signal.aborted) simulasiLoading.value = false;
    }
  },
  1000,
);

watch(
  [
    () => state.jumlahPokok,
    () => state.jangkaWaktuBulan,
    () => state.persenMarginTahun,
    customMarginActive,
    canManage,
    simulasiRefresh,
  ],
  (_value, _oldValue, onCleanup) => {
    simulasiMargin.value = undefined;
    simulasiError.value = "";
    simulasiLoading.value = false;
    if (!canManage.value || (customMarginActive.value && state.persenMarginTahun === undefined)) {
      return;
    }
    const parsed = simulasiSchema.safeParse({
      jumlahPokok: state.jumlahPokok,
      jangkaWaktuBulan: state.jangkaWaktuBulan,
      persenMarginTahun: customMarginActive.value ? state.persenMarginTahun : undefined,
    });
    if (!parsed.success) return;

    const controller = new AbortController();
    simulasiLoading.value = true;
    void fetchSimulasiMargin(parsed.data, controller.signal);
    onCleanup(() => {
      fetchSimulasiMargin.cancel();
      controller.abort();
    });
  },
  { flush: "sync" },
);
const ready = computed(
  () =>
    canManage.value &&
    membersStatus.value === "success" &&
    memberOptions.value.some((member) => member.value === state.userId && !member.disabled) &&
    (!overrideMargin.value || (canOverride.value && state.persenMarginTahun !== undefined)),
);

async function onSubmit(event: FormSubmitEvent<PengajuanPembiayaan>) {
  if (isLoading.value || !ready.value) return;
  if (!canDelegate.value && event.data.userId !== actorId.value) return;
  const recordsTransfer = isAdmin.value;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/pembiayaan", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      retry: 0,
      body: {
        ...event.data,
        persenMarginTahun:
          canOverride.value && overrideMargin.value ? event.data.persenMarginTahun : undefined,
      },
    });
  } catch (error) {
    useToastError(
      "Gagal Mengajukan Pembiayaan",
      extractErrorMessage(error, "Pengajuan gagal disimpan. Silakan coba lagi."),
    );
    isLoading.value = false;
    return;
  }
  useToastSuccess(
    "Pembiayaan Berhasil Diajukan",
    recordsTransfer
      ? "Dana wakalah dan jurnal telah dicatat. Pengajuan menunggu persetujuan akad."
      : "Pengajuan menunggu penyaluran dana wakalah oleh admin, lalu persetujuan akad.",
  );
  emit("close");
  await refreshPembiayaanData(props.refresh);
}
</script>

<template>
  <UModal
    title="Ajukan Pembiayaan"
    :description="
      isAdmin
        ? 'Input pembiayaan sekaligus mencatat penyaluran dana wakalah.'
        : 'Ajukan pembiayaan untuk penyaluran dana wakalah dan persetujuan akad oleh admin.'
    "
    :ui="{ content: 'sm:max-w-2xl' }"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-pembiayaan"
        :schema="pembiayaanSchema"
        :state="state"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField label="Anggota" name="userId" required>
          <USelectMenu
            v-model="state.userId"
            :items="memberOptions"
            value-key="value"
            placeholder="Pilih anggota"
            :loading="membersStatus === 'pending'"
            :disabled="!canDelegate || membersStatus !== 'success' || isLoading"
            class="w-full"
          />
        </UFormField>
        <UAlert
          v-if="membersError"
          title="Gagal Memuat Anggota"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]"
        />
        <UAlert
          v-else-if="
            membersStatus === 'success' &&
            (canDelegate
              ? !memberOptions.some((member) => !member.disabled)
              : !memberOptions.some((member) => member.value === actorId && !member.disabled))
          "
          title="Anggota Belum Tersedia"
          description="Pengajuan pembiayaan memerlukan nomor anggota yang valid."
          color="info"
          variant="subtle"
        />
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Jumlah Pokok" name="jumlahPokok" required>
            <UInputNumber
              v-model="state.jumlahPokok"
              :min="1"
              :max="maxPembiayaanAmount"
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
          <UFormField label="Jangka Waktu (Bulan)" name="jangkaWaktuBulan" required>
            <UInputNumber
              v-model="state.jangkaWaktuBulan"
              :min="1"
              :max="maxPembiayaanAmount"
              :step="1"
              placeholder="Jumlah bulan"
              disable-wheel-change
              class="w-full"
            />
          </UFormField>
        </div>
        <USwitch
          v-if="canOverride"
          v-model="overrideMargin"
          label="Gunakan margin khusus (admin)"
          :disabled="isLoading"
        />
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Margin per Tahun (%)"
            name="persenMarginTahun"
            :required="customMarginActive"
          >
            <div class="relative">
              <UInputNumber
                v-model="persenMargin"
                :disabled="!customMarginActive || isLoading"
                :aria-busy="simulasiLoading"
                :min="0"
                :max="99_999"
                :step="1"
                :increment="false"
                :decrement="false"
                :format-options="{ maximumFractionDigits: 0 }"
                :ui="{ base: simulasiLoading ? 'pe-9' : undefined }"
                locale="id-ID"
                placeholder="—"
                disable-wheel-change
                class="w-full"
              />
              <UIcon
                v-if="simulasiLoading"
                name="i-tabler-loader-2"
                class="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted"
                aria-hidden="true"
              />
            </div>
          </UFormField>
          <UFormField label="Jumlah Margin (Rp)">
            <div class="relative">
              <UInputNumber
                :model-value="simulasiMargin?.jumlahMargin"
                :aria-busy="simulasiLoading"
                :increment="false"
                :decrement="false"
                :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }"
                :ui="{ base: simulasiLoading ? 'pe-9' : undefined }"
                locale="id-ID"
                placeholder="—"
                disabled
                class="w-full"
              />
              <UIcon
                v-if="simulasiLoading"
                name="i-tabler-loader-2"
                class="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted"
                aria-hidden="true"
              />
            </div>
          </UFormField>
        </div>
        <UAlert
          v-if="simulasiError"
          title="Gagal Menghitung Margin"
          :description="simulasiError"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => simulasiRefresh++ }]"
        />
        <UFormField label="Metode Pencairan" name="metodePembayaran" required>
          <USelect v-model="state.metodePembayaran" :items="paymentMethodOptions" class="w-full" />
        </UFormField>
        <UFormField label="Tujuan Pembiayaan" name="tujuan" required>
          <UTextarea
            v-model="state.tujuan"
            placeholder="Jelaskan tujuan penggunaan pembiayaan"
            class="w-full"
          />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')"
          >Batal</UButton
        >
        <UButton
          type="submit"
          form="form-pembiayaan"
          icon="i-tabler-send"
          :loading="isLoading"
          :disabled="!ready"
          >{{ isAdmin ? "Simpan & Catat Wakalah" : "Ajukan" }}</UButton
        >
      </div>
    </template>
  </UModal>
</template>
