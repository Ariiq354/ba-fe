<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Angsuran, AngsuranAction, RejectAngsuran } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { canCancelAngsuran, rejectAngsuranSchema } from "../model";

const props = defineProps<{
  angsuran: Angsuran;
  action: AngsuranAction;
  refresh: (userId: number) => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const isLoading = ref(false);
const stale = ref(false);
const state = reactive({ alasanPenolakan: "" });
const labels = {
  approve: {
    title: "Setujui Angsuran",
    button: "Setujui",
    success: "Angsuran disetujui.",
    color: "primary",
  },
  reject: {
    title: "Tolak Angsuran",
    button: "Tolak",
    success: "Angsuran ditolak.",
    color: "error",
  },
  cancel: {
    title: "Batalkan Angsuran",
    button: "Batalkan Pengajuan",
    success: "Pengajuan dibatalkan.",
    color: "warning",
  },
} as const;
const canProcess = computed(() => {
  if (stale.value || props.angsuran.statusApproved !== "pending") return false;
  const role = session.value.data?.user.role;
  return props.action === "cancel"
    ? can(role, "angsuran", "manage") &&
        canCancelAngsuran(props.angsuran, Number(session.value.data?.user.id))
    : can(role, "approvalAngsuran", "manage");
});

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
        ? "/api/v1/angsuran"
        : `/api/v1/angsuran/${props.angsuran.id}/${props.action}`,
      {
        baseURL: API_URL,
        method: props.action === "cancel" ? "DELETE" : "PATCH",
        credentials: "include",
        retry: 0,
        body:
          props.action === "cancel"
            ? { ids: [props.angsuran.id] }
            : props.action === "reject"
              ? { alasanPenolakan }
              : undefined,
      },
    );
  } catch (error) {
    useToastError(
      "Gagal Memproses Angsuran",
      extractErrorMessage(error, "Angsuran gagal diproses. Silakan coba lagi."),
    );
    if (
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      [404, 409].includes(Number(error.statusCode))
    )
      stale.value = true;
    await Promise.allSettled([props.refresh(props.angsuran.userId)]);
    isLoading.value = false;
    return;
  }
  useToastSuccess(
    labels[props.action].success,
    props.action === "approve" ? "Pembayaran dan jurnal telah dicatat." : "",
  );
  emit("close");
  await props.refresh(props.angsuran.userId);
}
function onReject(event: FormSubmitEvent<RejectAngsuran>) {
  return onConfirm(event.data.alasanPenolakan);
}
</script>

<template>
  <UModal
    :title="labels[action].title"
    :description="angsuran.kodeTransaksi"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <div class="space-y-4">
        <div class="space-y-2">
          <p class="font-medium">{{ angsuran.memberName }}</p>
          <p class="text-sm text-muted">
            {{ angsuran.kodePembiayaan }} · {{ angsuran.metodePembayaran }}
          </p>
          <p class="text-lg font-semibold">{{ formatRupiah(angsuran.jumlahPembayaran) }}</p>
        </div>
        <p v-if="stale" class="text-sm text-error">
          Data telah berubah. Tutup dan periksa daftar terbaru.
        </p>
        <UForm
          v-if="action === 'reject'"
          id="form-reject-angsuran"
          :schema="rejectAngsuranSchema"
          :state="state"
          :disabled="isLoading"
          @submit="onReject"
        >
          <UFormField label="Alasan Penolakan" name="alasanPenolakan" required>
            <UTextarea v-model="state.alasanPenolakan" class="w-full" />
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
          :form="action === 'reject' ? 'form-reject-angsuran' : undefined"
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
