<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Pembiayaan, PembiayaanAction, RejectPembiayaan } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { formatRupiah } from "~/utils/format";
import { canProcessPembiayaan, rejectPembiayaanSchema } from "../model";

const props = defineProps<{
  pembiayaan: Pembiayaan;
  action: PembiayaanAction;
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const isLoading = ref(false);
const state = reactive({ alasanPenolakan: "" });
const labels = {
  transfer: {
    title: "Transfer",
    button: "Transfer",
    success: "Dana wakalah berhasil dicatat.",
    description: "Jurnal wakalah telah dibuat. Pengajuan menunggu persetujuan akad.",
    color: "warning",
  },
  approve: {
    title: "Setujui Pembiayaan",
    button: "Setujui",
    success: "Pembiayaan disetujui.",
    description: "Jurnal akad telah dicatat. Pembiayaan sudah dapat diangsur.",
    color: "primary",
  },
  reject: {
    title: "Tolak Pembiayaan",
    button: "Tolak",
    success: "Pembiayaan ditolak.",
    description: "Pengajuan pembiayaan tidak dilanjutkan.",
    color: "error",
  },
  cancel: {
    title: "Batalkan Pembiayaan",
    button: "Batalkan Pengajuan",
    success: "Pengajuan dibatalkan.",
    description: "Pengajuan telah dihapus dari daftar.",
    color: "warning",
  },
} as const;
const canProcess = computed(() => canProcessPembiayaan(props.pembiayaan, props.action));
async function onConfirm(alasanPenolakan?: string) {
  if (
    isLoading.value ||
    !canProcess.value ||
    (props.action === "reject" && !alasanPenolakan?.trim())
  )
    return;
  isLoading.value = true;
  try {
    await $fetch(
      props.action === "cancel"
        ? "/api/v1/pembiayaan"
        : `/api/v1/pembiayaan/${props.pembiayaan.id}/${props.action}`,
      {
        baseURL: API_URL,
        method: props.action === "cancel" ? "DELETE" : "PATCH",
        credentials: "include",
        retry: 0,
        body:
          props.action === "cancel"
            ? { ids: [props.pembiayaan.id] }
            : props.action === "reject"
              ? { alasanPenolakan }
              : undefined,
      },
    );
  } catch (error) {
    useToastError(
      "Gagal Memproses Pembiayaan",
      extractErrorMessage(error, "Pengajuan gagal diproses. Silakan coba lagi."),
    );
    isLoading.value = false;
    return;
  }
  useToastSuccess(labels[props.action].success, labels[props.action].description);
  emit("close");
  await props.refresh();
}
function onReject(event: FormSubmitEvent<RejectPembiayaan>) {
  return onConfirm(event.data.alasanPenolakan);
}
</script>

<template>
  <UModal
    :title="labels[action].title"
    :description="pembiayaan.kodeTransaksi"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="font-medium">{{ pembiayaan.memberName }}</p>
          <p class="text-sm">Pokok: {{ formatRupiah(pembiayaan.jumlahPokok) }}</p>
          <p class="text-sm">
            Margin: {{ formatRupiah(pembiayaan.jumlahMargin) }} ({{
              pembiayaan.persenMarginTahun.toLocaleString("id-ID")
            }}% per tahun)
          </p>
          <p v-if="action === 'transfer'" class="text-lg font-semibold">
            Dana wakalah: {{ formatRupiah(pembiayaan.jumlahPokok) }}
          </p>
          <p class="text-lg font-semibold">
            Total Pokok + Margin: {{ formatRupiah(pembiayaan.totalPembiayaan) }}
          </p>
          <p class="text-sm text-muted">
            {{ pembiayaan.jangkaWaktuBulan }} bulan · {{ pembiayaan.metodePembayaran }}
          </p>
          <p class="text-sm">Biaya akad terpisah: {{ formatRupiah(pembiayaan.biayaAkad) }}</p>
          <p class="text-sm whitespace-pre-wrap wrap-break-word">{{ pembiayaan.tujuan }}</p>
        </div>
        <UForm
          v-if="action === 'reject'"
          id="form-reject-pembiayaan"
          :schema="rejectPembiayaanSchema"
          :state="state"
          :disabled="isLoading"
          @submit="onReject"
        >
          <UFormField label="Alasan Penolakan" name="alasanPenolakan" required>
            <UTextarea
              v-model="state.alasanPenolakan"
              placeholder="Tuliskan alasan penolakan"
              class="w-full"
            />
          </UFormField>
        </UForm>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')"
          >Kembali</UButton
        >
        <UButton
          :type="action === 'reject' ? 'submit' : 'button'"
          :form="action === 'reject' ? 'form-reject-pembiayaan' : undefined"
          :color="labels[action].color"
          :loading="isLoading"
          :disabled="!canProcess"
          @click="action !== 'reject' && onConfirm()"
          >{{ labels[action].button }}</UButton
        >
      </div>
    </template>
  </UModal>
</template>
