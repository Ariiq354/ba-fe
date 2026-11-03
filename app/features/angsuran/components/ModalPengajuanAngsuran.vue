<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { PengajuanAngsuran } from "../model";
import type { PembiayaanOptionsResponse } from "~/features/pembiayaan/model";
import type { AnggotaOptionsResponse } from "~/features/simpanan/model";
import { useApi } from "~/composables/fetch";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { getPembiayaanOptionsKey } from "~/features/pembiayaan/data";
import { getAnggotaOptions, paymentMethodOptions } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import { getAngsuranSchema, maxAngsuranAmount } from "../model";
import PemilihPembiayaan from "./PemilihPembiayaan.vue";
import RingkasanAngsuran from "./RingkasanAngsuran.vue";

const props = defineProps<{
  refresh: (userId: number, journalChanged?: boolean) => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const canManage = computed(() => can(session.value.data?.user.role, "angsuran", "manage"));
const canDelegate = computed(() => can(session.value.data?.user.role, "angsuran", "delegate"));
const isLoading = ref(false);
const state = reactive({
  userId: actorId.value,
  pembiayaanId: undefined as number | undefined,
  jumlahPembayaran: undefined as number | undefined,
  metodePembayaran: "Transfer" as PengajuanAngsuran["metodePembayaran"],
  keterangan: "",
});
watch(
  [actorId, canDelegate],
  () => {
    if (!canDelegate.value) state.userId = actorId.value;
  },
  { flush: "sync", immediate: true },
);
watch(
  () => state.userId,
  () => {
    state.pembiayaanId = undefined;
    state.jumlahPembayaran = undefined;
  },
  { flush: "sync" },
);
watch(
  () => state.pembiayaanId,
  () => {
    state.jumlahPembayaran = undefined;
  },
  { flush: "sync" },
);

const {
  data: members,
  status: membersStatus,
  error: membersError,
  refresh: refreshMembers,
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canManage,
  watch: [canManage],
});
const memberOptions = computed(() => getAnggotaOptions(members.value?.data ?? []));
const memberReady = computed(
  () =>
    canManage.value &&
    membersStatus.value === "success" &&
    memberOptions.value.some((member) => member.value === state.userId && !member.disabled) &&
    (canDelegate.value || state.userId === actorId.value),
);
const {
  data: pembiayaan,
  status: pembiayaanStatus,
  error: pembiayaanError,
  refresh: refreshPembiayaan,
} = useApi<PembiayaanOptionsResponse>("/api/v1/pembiayaan/options", {
  key: computed(() => getPembiayaanOptionsKey(state.userId)),
  query: { userId: computed(() => state.userId) },
  enabled: memberReady,
  watch: [memberReady],
});
const pembiayaanOptions = computed(() => (memberReady.value ? (pembiayaan.value?.data ?? []) : []));
const selectedPembiayaan = computed(() =>
  pembiayaanOptions.value.find((item) => item.id === state.pembiayaanId),
);
watch(
  [pembiayaanOptions, pembiayaanStatus],
  () => {
    if (
      pembiayaanStatus.value === "success" &&
      state.pembiayaanId !== undefined &&
      !selectedPembiayaan.value
    ) {
      state.pembiayaanId = undefined;
    }
  },
  { flush: "sync" },
);
const maxAmount = computed(() =>
  Math.min(selectedPembiayaan.value?.sisaTagihan ?? 0, maxAngsuranAmount),
);
const schema = computed(() => getAngsuranSchema(selectedPembiayaan.value?.sisaTagihan ?? 0));
const ready = computed(
  () =>
    memberReady.value &&
    pembiayaanStatus.value === "success" &&
    !!selectedPembiayaan.value &&
    maxAmount.value > 0,
);

async function onSubmit(event: FormSubmitEvent<PengajuanAngsuran>) {
  if (
    isLoading.value ||
    !ready.value ||
    event.data.pembiayaanId !== selectedPembiayaan.value?.id ||
    event.data.jumlahPembayaran > maxAmount.value
  )
    return;
  const userId = state.userId;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/angsuran", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      retry: 0,
      body: event.data,
    });
  } catch (error) {
    useToastError(
      "Gagal Mengajukan Angsuran",
      extractErrorMessage(error, "Pengajuan gagal disimpan. Silakan coba lagi."),
    );
    await Promise.allSettled([props.refresh(userId)]);
    isLoading.value = false;
    return;
  }
  useToastSuccess("Angsuran Berhasil Diajukan", "Menunggu persetujuan admin.");
  emit("close");
  await props.refresh(userId);
}
</script>

<template>
  <UModal
    title="Ajukan Angsuran"
    :ui="{ content: 'sm:max-w-2xl' }"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-angsuran"
        :schema="schema"
        :state="state"
        :disabled="isLoading"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField v-if="canDelegate" label="Anggota" name="userId" required>
          <USelectMenu
            v-model="state.userId"
            :items="memberOptions"
            value-key="value"
            placeholder="Pilih anggota"
            :loading="membersStatus === 'pending'"
            :disabled="membersStatus !== 'success' || isLoading"
            class="w-full"
          />
        </UFormField>
        <p v-else class="font-medium">{{ session.data?.user.name ?? "Saya" }}</p>
        <UAlert
          v-if="membersError"
          title="Gagal Memuat Anggota"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]"
        />
        <p v-else-if="membersStatus === 'success' && !memberReady" class="text-sm text-muted">
          Pilih anggota dengan nomor anggota yang valid.
        </p>
        <UFormField label="Pembiayaan" name="pembiayaanId" required>
          <PemilihPembiayaan
            v-model="state.pembiayaanId"
            :options="pembiayaanOptions"
            :loading="pembiayaanStatus === 'pending'"
            :disabled="!memberReady || pembiayaanStatus !== 'success' || isLoading"
          />
        </UFormField>
        <UAlert
          v-if="pembiayaanError && memberReady"
          title="Gagal Memuat Pembiayaan"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshPembiayaan() }]"
        />
        <USkeleton
          v-else-if="pembiayaanStatus === 'pending' && state.pembiayaanId !== undefined"
          class="h-44 w-full"
        />
        <RingkasanAngsuran v-else-if="selectedPembiayaan" :ringkasan="selectedPembiayaan" />
        <UFormField label="Nominal Pembayaran" name="jumlahPembayaran" required>
          <UInputNumber
            v-model="state.jumlahPembayaran"
            :min="1"
            :max="maxAmount"
            :step="1"
            :increment="false"
            :decrement="false"
            :format-options="{ style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }"
            :disabled="!ready || isLoading"
            locale="id-ID"
            placeholder="Rp0"
            disable-wheel-change
            class="w-full"
          />
        </UFormField>
        <UFormField label="Metode Pembayaran" name="metodePembayaran" required>
          <USelect v-model="state.metodePembayaran" :items="paymentMethodOptions" class="w-full" />
        </UFormField>
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
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')"
          >Batal</UButton
        >
        <UButton
          type="submit"
          form="form-angsuran"
          icon="i-tabler-send"
          :loading="isLoading"
          :disabled="!ready"
          >Ajukan</UButton
        >
      </div>
    </template>
  </UModal>
</template>
