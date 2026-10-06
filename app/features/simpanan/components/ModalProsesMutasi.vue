<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { MutasiSimpanan, RejectMutasiSchema } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { APPROVAL_SIMPANAN_PENDING_KEY } from "../data";
import { canCancelMutasi, rejectMutasiSchema } from "../model";

const props = defineProps<{
  mutasi: MutasiSimpanan;
  action: "approve" | "reject" | "cancel";
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const isLoading = ref(false);
const state = reactive({ alasanPenolakan: "" });
const labels = {
  approve: { title: "Setujui Pengajuan", button: "Setujui", success: "Pengajuan Berhasil Disetujui", color: "primary" },
  reject: { title: "Tolak Pengajuan", button: "Tolak", success: "Pengajuan Berhasil Ditolak", color: "error" },
  cancel: { title: "Batalkan Pengajuan", button: "Batalkan Pengajuan", success: "Pengajuan Berhasil Dibatalkan", color: "warning" },
} as const;
const canProcess = computed(() => {
  if (props.mutasi.statusApproved !== "pending")
    return false;
  const role = session.value.data?.user.role;
  if (props.action !== "cancel")
    return can(role, "approvalSimpanan", "manage");
  return (can(role, "simpananSaya", "manage") || can(role, "mutasiSimpanan", "manage"))
    && canCancelMutasi(props.mutasi, Number(session.value.data?.user.id));
});

async function onConfirm(alasanPenolakan?: string) {
  if (isLoading.value || !canProcess.value)
    return;
  if (props.action === "reject" && !alasanPenolakan?.trim())
    return;
  isLoading.value = true;
  try {
    await $fetch(props.action === "cancel" ? "/api/v1/simpanan/mutasi" : `/api/v1/simpanan/mutasi/${props.mutasi.id}/${props.action}`, {
      baseURL: API_URL,
      method: props.action === "cancel" ? "DELETE" : "PATCH",
      credentials: "include",
      body: props.action === "cancel" ? { ids: [props.mutasi.id] } : props.action === "reject" ? { alasanPenolakan } : undefined,
    });
  }
  catch (error) {
    useToastError("Gagal Memproses Pengajuan", extractErrorMessage(error, "Pengajuan gagal diproses. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }
  useToastSuccess(labels[props.action].success);
  emit("close");
  await Promise.all([props.refresh(), refreshNuxtData(APPROVAL_SIMPANAN_PENDING_KEY)]);
}

function onReject(event: FormSubmitEvent<RejectMutasiSchema>) {
  return onConfirm(event.data.alasanPenolakan);
}
</script>

<template>
  <UModal :title="labels[action].title" :description="mutasi.kodeTransaksi" :dismissible="!isLoading" :close="isLoading ? false : { onClick: () => emit('close') }">
    <template #body>
      <div class="space-y-4">
        <dl class="space-y-3 rounded-lg bg-elevated p-4">
          <div>
            <dt class="text-sm text-muted">
              Anggota
            </dt><dd class="font-medium">
              {{ mutasi.memberName }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Transaksi
            </dt><dd class="capitalize">
              {{ mutasi.jenisTransaksi }} {{ mutasi.jenisSimpanan }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Nominal
            </dt><dd class="font-semibold">
              {{ formatRupiah(mutasi.nilaiTransaksi) }}
            </dd>
          </div>
          <div>
            <dt class="text-sm text-muted">
              Diinput Oleh
            </dt><dd>{{ mutasi.creatorName }}</dd>
          </div>
        </dl>
        <UForm v-if="action === 'reject'" id="form-reject-simpanan" :schema="rejectMutasiSchema" :state="state" :disabled="isLoading" @submit="onReject">
          <UFormField label="Alasan Penolakan" name="alasanPenolakan" required>
            <UTextarea v-model="state.alasanPenolakan" placeholder="Tuliskan alasan penolakan" class="w-full" />
          </UFormField>
        </UForm>
        <p v-else class="text-sm text-muted">
          {{ action === 'approve' ? 'Persetujuan akan memperbarui saldo atau jumlah saham dan membuat jurnal otomatis.' : 'Pengajuan pending ini akan dibatalkan.' }}
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Kembali
        </UButton>
        <UButton
          :type="action === 'reject' ? 'submit' : 'button'"
          :form="action === 'reject' ? 'form-reject-simpanan' : undefined"
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
