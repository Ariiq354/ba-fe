<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Pemindahbukuan, RejectPemindahbukuan } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { formatRupiah } from "~/utils/format";
import {
  formatPemindahbukuanValue,
  getPemindahbukuanDestination,
  getPemindahbukuanNominalLabel,
  rejectPemindahbukuanSchema,
  tipePemindahbukuanLabels,
} from "../model";

const props = defineProps<{
  transfer: Pemindahbukuan;
  action: "approve" | "reject" | "cancel";
  refresh: (userIds: number[]) => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const isLoading = ref(false);
const state = reactive({ alasanPenolakan: "" });
const labels = {
  approve: {
    title: "Setujui Pemindahbukuan",
    button: "Setujui",
    success: "Pemindahbukuan Berhasil Disetujui",
    description: "Saldo atau saham telah dipindahkan.",
    color: "primary",
  },
  reject: {
    title: "Tolak Pemindahbukuan",
    button: "Tolak",
    success: "Pemindahbukuan Berhasil Ditolak",
    description: "Pemindahbukuan tidak dilanjutkan.",
    color: "error",
  },
  cancel: {
    title: "Batalkan Pemindahbukuan",
    button: "Batalkan Pengajuan",
    success: "Pemindahbukuan Berhasil Dibatalkan",
    description: "Pengajuan telah dihapus dari daftar.",
    color: "warning",
  },
} as const;
const canProcess = computed(() => props.transfer.statusApproved === "pending");

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
        ? "/api/v1/pemindahbukuan"
        : `/api/v1/pemindahbukuan/${props.transfer.id}/${props.action}`,
      {
        baseURL: API_URL,
        method: props.action === "cancel" ? "DELETE" : "PATCH",
        credentials: "include",
        body:
          props.action === "cancel"
            ? { ids: [props.transfer.id] }
            : props.action === "reject"
              ? { alasanPenolakan }
              : undefined,
      },
    );
  } catch (error) {
    useToastError(
      "Gagal Memproses Pemindahbukuan",
      extractErrorMessage(error, "Pengajuan gagal diproses. Silakan coba lagi."),
    );
    isLoading.value = false;
    return;
  }
  useToastSuccess(
    labels[props.action].success,
    props.action === "approve" && props.transfer.tipePemindahbukuan === "pembelian_kembali_saham"
      ? "Pembelian kembali saham telah dicatat."
      : labels[props.action].description,
  );
  emit("close");
  await props.refresh(
    [props.transfer.idUserSumber, props.transfer.idUserTujuan].filter(
      (id): id is number => id != null,
    ),
  );
}
function onReject(event: FormSubmitEvent<RejectPemindahbukuan>) {
  return onConfirm(event.data.alasanPenolakan);
}
</script>

<template>
  <UModal
    :title="labels[action].title"
    :description="transfer.kodeTransaksi"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="font-medium">
            {{ transfer.sourceMemberName }} → {{ getPemindahbukuanDestination(transfer) }}
          </p>
          <p class="text-sm text-muted">
            {{ tipePemindahbukuanLabels[transfer.tipePemindahbukuan] }}
          </p>
          <p class="text-lg font-semibold">
            {{ formatPemindahbukuanValue(transfer) }}
          </p>
          <p
            v-if="transfer.tipePemindahbukuan !== 'tabungan_ke_tabungan'"
            class="text-sm text-muted"
          >
            {{ getPemindahbukuanNominalLabel(transfer.tipePemindahbukuan) }}:
            {{ formatRupiah(transfer.nominal) }}
          </p>
        </div>
        <UForm
          v-if="action === 'reject'"
          id="form-reject-pemindahbukuan"
          :schema="rejectPemindahbukuanSchema"
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
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Kembali
        </UButton>
        <UButton
          :type="action === 'reject' ? 'submit' : 'button'"
          :form="action === 'reject' ? 'form-reject-pemindahbukuan' : undefined"
          :color="labels[action].color"
          :loading="isLoading"
          :disabled="!canProcess"
          @click="action !== 'reject' && onConfirm()"
        >
          {{ labels[action].button }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
