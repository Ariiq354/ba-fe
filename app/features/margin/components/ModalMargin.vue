<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Margin, MarginSchema } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { initMarginFormdata, jaminanOptions, marginSchema } from "../model";

const props = defineProps<{
  margin?: Margin;
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const state = reactive({ ...initMarginFormdata, ...props.margin });
const isLoading = ref(false);
const form = useTemplateRef("form");
let previousMaxNominal = state.maxNominal ?? undefined;
const isUnlimited = computed({
  get: () => state.maxNominal === null,
  set(value: boolean) {
    if (value === (state.maxNominal === null))
      return;
    if (value) {
      previousMaxNominal = state.maxNominal ?? undefined;
      state.maxNominal = null;
    }
    else {
      state.maxNominal = previousMaxNominal;
    }
    form.value?.clear("maxNominal");
  },
});

async function onSubmit(event: FormSubmitEvent<MarginSchema>) {
  if (isLoading.value)
    return;
  isLoading.value = true;

  try {
    await $fetch(props.margin ? `/api/v1/master-margin/${props.margin.id}` : "/api/v1/master-margin", {
      baseURL: API_URL,
      method: props.margin ? "PATCH" : "POST",
      credentials: "include",
      body: event.data,
    });
  }
  catch (error) {
    useToastError("Gagal Menyimpan Margin", extractErrorMessage(error, "Margin gagal disimpan. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }

  useToastSuccess(props.margin ? "Margin Berhasil Diperbarui" : "Margin Berhasil Ditambahkan");
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    :title="margin ? 'Edit Margin' : 'Tambah Margin'"
    description="Atur rentang nominal dan ketentuan margin pembiayaan."
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <UForm id="form-margin" ref="form" :schema="marginSchema" :state="state" :disabled="isLoading" class="space-y-4" @submit="onSubmit">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Nominal Minimum (Rp)" name="minNominal" required>
            <UInputNumber v-model="state.minNominal" :min="0" :step="1" placeholder="0" class="w-full" />
          </UFormField>
          <div class="space-y-2">
            <UFormField label="Nominal Maksimum (Rp)" name="maxNominal" :required="!isUnlimited">
              <UInputNumber v-model.optional="state.maxNominal" :min="0" :step="1" :disabled="isUnlimited" :placeholder="isUnlimited ? 'Seterusnya' : '0'" class="w-full" />
            </UFormField>
            <UCheckbox v-model="isUnlimited" label="Tanpa batas maksimum (seterusnya)" />
          </div>
        </div>
        <UFormField label="Margin per Tahun (%)" name="persenMarginTahun" required>
          <UInputNumber v-model="state.persenMarginTahun" :min="0" :step="1" placeholder="0" class="w-full" />
        </UFormField>
        <UFormField label="Jaminan" name="jaminan" required>
          <USelect v-model="state.jaminan" :items="jaminanOptions" class="w-full" />
        </UFormField>
        <UFormField label="Biaya Akad (Rp)" name="biayaAkad" required>
          <UInputNumber v-model="state.biayaAkad" :min="0" :step="1" class="w-full" />
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton type="submit" form="form-margin" icon="i-tabler-check" :loading="isLoading">
          Simpan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
