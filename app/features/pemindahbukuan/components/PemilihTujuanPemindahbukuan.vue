<script setup lang="ts">
import type { TipePemindahbukuan } from "../model";
import type { AnggotaOptionsResponse, AnggotaSimpanan } from "~/features/simpanan/model";
import { useApi } from "~/composables/fetch";
import { getAnggotaOptions } from "~/features/simpanan/model";

const props = defineProps<{
  source?: AnggotaSimpanan;
  tipe: TipePemindahbukuan;
  disabled: boolean;
}>();
const selectedMember = defineModel<AnggotaSimpanan>();
const conversion = computed(() => props.tipe === "tabungan_ke_saham");
const destinationEnabled = computed(() => !conversion.value);
const {
  data: destinations,
  status: destinationStatus,
  error: destinationError,
  refresh: refreshDestinations,
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  query: { all: true },
  enabled: destinationEnabled,
  watch: [destinationEnabled],
});
const selectedId = computed({
  get: () => selectedMember.value?.id,
  set: (id: number | undefined) => {
    if (props.disabled || conversion.value) return;
    selectedMember.value = destinations.value?.data.find(
      (member) => member.id === id && member.id !== props.source?.id && member.noAnggota?.trim(),
    );
  },
});
const destinationOptions = computed(() => {
  const members = new Map((destinations.value?.data ?? []).map((member) => [member.id, member]));
  if (selectedMember.value) members.set(selectedMember.value.id, selectedMember.value);
  return getAnggotaOptions(
    [...members.values()].filter((member) => member.id !== props.source?.id),
  );
});
</script>

<template>
  <div class="space-y-3 rounded-lg border border-default p-4">
    <h3 class="font-medium text-highlighted">Tujuan</h3>
    <UFormField
      v-if="conversion"
      label="Anggota Tujuan"
      name="idUserTujuan"
      description="Konversi tabungan ke saham dilakukan untuk anggota yang sama."
      required
    >
      <UInput
        :model-value="source ? `${source.name} · ${source.namaKelompok}` : ''"
        placeholder="Pilih anggota sumber terlebih dahulu"
        readonly
        class="w-full"
      />
    </UFormField>
    <template v-else>
      <UFormField label="Anggota Tujuan" name="idUserTujuan" required>
        <USelectMenu
          v-model="selectedId"
          :items="destinationOptions"
          value-key="value"
          placeholder="Pilih anggota tujuan"
          :search-input="{ placeholder: 'Cari nama atau kelompok...' }"
          :loading="destinationStatus === 'pending'"
          :disabled="disabled || destinationStatus !== 'success'"
          class="w-full"
        />
      </UFormField>
      <UAlert
        v-if="destinationError"
        title="Gagal Memuat Anggota Tujuan"
        color="error"
        variant="subtle"
        :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshDestinations() }]"
      />
    </template>
    <p class="text-sm text-muted">
      {{ tipe === "tabungan_ke_tabungan" ? "Menerima tabungan" : "Menerima saham" }}
    </p>
  </div>
</template>
