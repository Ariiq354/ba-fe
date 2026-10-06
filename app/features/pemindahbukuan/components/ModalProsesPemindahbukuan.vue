<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Pemindahbukuan, RejectPemindahbukuan } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { refreshPemindahbukuanData } from "../data";
import { canCancelPemindahbukuan, formatPemindahbukuanValue, rejectPemindahbukuanSchema, tipePemindahbukuanLabels } from "../model";

const props = defineProps<{
  transfer: Pemindahbukuan;
  action: "approve" | "reject" | "cancel";
  accessibleSourceIds?: number[];
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const isLoading = ref(false);
const state = reactive({ alasanPenolakan: "" });
const labels = {
  approve: { title: "Setujui Pemindahbukuan", button: "Setujui", success: "Pemindahbukuan Berhasil Disetujui", color: "primary" },
  reject: { title: "Tolak Pemindahbukuan", button: "Tolak", success: "Pemindahbukuan Berhasil Ditolak", color: "error" },
  cancel: { title: "Batalkan Pemindahbukuan", button: "Batalkan Pengajuan", success: "Pemindahbukuan Berhasil Dibatalkan", color: "warning" },
} as const;
const canProcess = computed(() => {
  if (props.transfer.statusApproved !== "pending")
    return false;
  const role = session.value.data?.user.role;
  return props.action === "cancel"
    ? can(role, "pemindahbukuan", "manage") && canCancelPemindahbukuan(props.transfer, Number(session.value.data?.user.id), props.accessibleSourceIds ?? [])
    : can(role, "approvalPemindahbukuan", "manage");
});

async function onConfirm(alasanPenolakan?: string) {
  if (isLoading.value || !canProcess.value || (props.action === "reject" && !alasanPenolakan?.trim()))
    return;
  isLoading.value = true;
  try {
    await $fetch(props.action === "cancel" ? "/api/v1/pemindahbukuan" : `/api/v1/pemindahbukuan/${props.transfer.id}/${props.action}`, {
      baseURL: API_URL,
      method: props.action === "cancel" ? "DELETE" : "PATCH",
      credentials: "include",
      body: props.action === "cancel" ? { ids: [props.transfer.id] } : props.action === "reject" ? { alasanPenolakan } : undefined,
    });
  }
  catch (error) {
    useToastError("Gagal Memproses Pemindahbukuan", extractErrorMessage(error, "Pengajuan gagal diproses. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }
  useToastSuccess(labels[props.action].success);
  emit("close");
  await refreshPemindahbukuanData([props.transfer.idUserSumber, props.transfer.idUserTujuan], props.refresh, props.action === "approve");
}
function onReject(event: FormSubmitEvent<RejectPemindahbukuan>) {
  return onConfirm(event.data.alasanPenolakan);
}
</script>

<template>
  <UModal :title="labels[action].title" :description="transfer.kodeTransaksi" :dismissible="!isLoading" :close="isLoading ? false : { onClick: () => emit('close') }">
    <template #body>
      <div class="space-y-4">
        <div class="space-y-2 rounded-lg bg-elevated p-4">
          <p class="font-medium">
            {{ transfer.sourceMemberName }} → {{ transfer.destinationMemberName }}
          </p>
          <p class="text-sm text-muted">
            {{ tipePemindahbukuanLabels[transfer.tipePemindahbukuan] }}
          </p>
          <p class="text-lg font-semibold">
            {{ formatPemindahbukuanValue(transfer) }}
          </p>
          <p v-if="transfer.tipePemindahbukuan !== 'tabungan_ke_tabungan'" class="text-sm text-muted">
            {{ transfer.tipePemindahbukuan === 'saham_ke_saham' ? 'Nilai referensi saham' : 'Tabungan digunakan' }}: {{ formatRupiah(transfer.nominal) }}
          </p>
        </div>
        <UForm v-if="action === 'reject'" id="form-reject-pemindahbukuan" :schema="rejectPemindahbukuanSchema" :state="state" :disabled="isLoading" @submit="onReject">
          <UFormField label="Alasan Penolakan" name="alasanPenolakan" required>
            <UTextarea v-model="state.alasanPenolakan" placeholder="Tuliskan alasan penolakan" class="w-full" />
          </UFormField>
        </UForm>
        <p v-else class="text-sm text-muted">
          {{ action === 'approve' ? 'Persetujuan akan memindahkan saldo atau saham dan membuat jurnal otomatis.' : 'Pengajuan akan dibatalkan dan cadangan saldo atau saham sumber dilepas.' }}
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Kembali
        </UButton>
        <UButton :type="action === 'reject' ? 'submit' : 'button'" :form="action === 'reject' ? 'form-reject-pemindahbukuan' : undefined" :color="labels[action].color" :loading="isLoading" :disabled="!canProcess" @click="action !== 'reject' && onConfirm()">
          {{ labels[action].button }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
