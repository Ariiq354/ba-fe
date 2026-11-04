<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type {
  MasterInputAkun,
  MasterInputAkunResponse,
  MasterInputTransaksi,
  MasterInputTransaksiSchema,
} from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import {
  getMasterInputTransaksiChanges,
  initMasterInputTransaksiFormdata,
  masterInputTransaksiSchema,
} from "../model";

const props = defineProps<{
  template?: MasterInputTransaksi;
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const state = reactive(initMasterInputTransaksiFormdata(props.template));
const isLoading = ref(false);

const {
  data: akun,
  status: akunStatus,
  error: akunError,
  refresh: refreshAkun,
} = useAsyncData("master-input-transaksi-akun-options", async () => {
  const accounts: MasterInputAkun[] = [];
  const limit = 100;
  let page = 1;
  let total = 0;
  do {
    const response = await $fetch<MasterInputAkunResponse>("/api/v1/master-akun", {
      baseURL: API_URL,
      credentials: "include",
      query: { page, limit, search: "", kategori: "all" },
    });
    accounts.push(...response.data);
    total = response.total;
    page++;
    if (!response.data.length) break;
  } while (accounts.length < total);
  return accounts;
});

const activeAccounts = computed(() => (akun.value ?? []).filter((account) => account.isActive));
const accountsReady = computed(
  () => akunStatus.value === "success" && !!activeAccounts.value.length,
);
const akunOptions = computed(() => {
  const options = activeAccounts.value.map((account) => ({
    label: `${account.kodeAkun} · ${account.namaAkun}`,
    value: account.id,
    disabled: false,
  }));
  if (props.template) {
    const storedAccounts = [
      {
        id: props.template.akunDebitId,
        kodeAkun: props.template.kodeAkunDebit,
        namaAkun: props.template.namaAkunDebit,
      },
      {
        id: props.template.akunKreditId,
        kodeAkun: props.template.kodeAkunKredit,
        namaAkun: props.template.namaAkunKredit,
      },
    ];
    for (const stored of storedAccounts) {
      if (options.some((option) => option.value === stored.id)) continue;
      const account = akun.value?.find((item) => item.id === stored.id) ?? stored;
      const suffix = akunStatus.value === "success" ? " (Nonaktif)" : "";
      options.push({
        label: `${account.kodeAkun} · ${account.namaAkun}${suffix}`,
        value: account.id,
        disabled: true,
      });
    }
  }
  return options;
});
const hasChanges = computed(
  () =>
    !props.template ||
    state.nama.trim() !== props.template.nama ||
    state.akunDebitId !== props.template.akunDebitId ||
    state.akunKreditId !== props.template.akunKreditId ||
    state.isActive !== props.template.isActive,
);

async function onSubmit(event: FormSubmitEvent<MasterInputTransaksiSchema>) {
  if (isLoading.value || (!props.template && !accountsReady.value) || !hasChanges.value) return;
  const body = props.template
    ? getMasterInputTransaksiChanges(event.data, props.template)
    : event.data;
  isLoading.value = true;
  try {
    await $fetch(
      props.template
        ? `/api/v1/master-input-transaksi/${props.template.id}`
        : "/api/v1/master-input-transaksi",
      {
        baseURL: API_URL,
        method: props.template ? "PATCH" : "POST",
        credentials: "include",
        body,
      },
    );
  } catch (error) {
    useToastError("Gagal Menyimpan Master Input", extractErrorMessage(error, "Silakan coba lagi."));
    isLoading.value = false;
    return;
  }
  useToastSuccess(
    props.template ? "Master Input Berhasil Diperbarui" : "Master Input Berhasil Ditambahkan",
    "Data telah disimpan.",
  );
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    :title="template ? 'Edit Master Input' : 'Tambah Master Input'"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm
        id="form-master-input-transaksi"
        :schema="masterInputTransaksiSchema"
        :state="state"
        :disabled="isLoading"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Nama" name="nama" required>
          <UInput v-model="state.nama" placeholder="Nama transaksi" class="w-full" />
        </UFormField>
        <UAlert
          v-if="akunError"
          title="Gagal Memuat Akun"
          description="Silakan coba lagi."
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
          v-else-if="akunStatus === 'success' && !activeAccounts.length"
          title="Belum Ada Akun Aktif"
          description="Aktifkan akun di Master Akun."
          color="info"
          variant="subtle"
        />
        <UFormField label="Akun Debit" name="akunDebitId" required>
          <USelectMenu
            v-model="state.akunDebitId"
            :items="akunOptions"
            value-key="value"
            placeholder="Pilih akun debit"
            :search-input="{ placeholder: 'Cari kode atau nama akun...' }"
            :loading="akunStatus === 'pending'"
            :disabled="!accountsReady || isLoading"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Akun Kredit" name="akunKreditId" required>
          <USelectMenu
            v-model="state.akunKreditId"
            :items="akunOptions"
            value-key="value"
            placeholder="Pilih akun kredit"
            :search-input="{ placeholder: 'Cari kode atau nama akun...' }"
            :loading="akunStatus === 'pending'"
            :disabled="!accountsReady || isLoading"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Status" name="isActive">
          <USwitch v-model="state.isActive" label="Aktif" />
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
          form="form-master-input-transaksi"
          icon="i-tabler-check"
          :loading="isLoading"
          :disabled="(!template && !accountsReady) || !hasChanges"
        >
          Simpan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
