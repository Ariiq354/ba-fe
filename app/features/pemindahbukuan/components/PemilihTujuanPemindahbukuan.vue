<script setup lang="ts">
import type { TipePemindahbukuan } from "../model";
import type { AnggotaOptionsResponse, AnggotaSimpanan } from "~/features/simpanan/model";
import { refDebounced } from "#imports";
import { useApi } from "~/composables/fetch";
import { getAnggotaOptions } from "~/features/simpanan/model";

const props = defineProps<{
  source?: AnggotaSimpanan;
  tipe: TipePemindahbukuan;
  enabled: boolean;
  disabled: boolean;
}>();
const selectedMember = defineModel<AnggotaSimpanan>();
const conversion = computed(() => props.tipe === "tabungan_ke_saham");
const search = ref("");
const debouncedSearch = refDebounced(search, 300);
const group = ref<number | "all">("all");
const destinationEnabled = computed(() => props.enabled && !conversion.value);
const {
  data: destinations,
  status: destinationStatus,
  error: destinationError,
  refresh: refreshDestinations,
} = useApi<AnggotaOptionsResponse>("/api/v1/pemindahbukuan/pengguna/options", {
  query: {
    search: debouncedSearch,
    idKelompok: computed(() => (group.value === "all" ? undefined : group.value)),
  },
  enabled: destinationEnabled,
  watch: [destinationEnabled],
});
const selectedId = computed({
  get: () => selectedMember.value?.id,
  set: (id: number | undefined) => {
    selectedMember.value =
      destinations.value?.data.find((member) => member.id === id) ??
      (selectedMember.value?.id === id ? selectedMember.value : undefined);
  },
});
const destinationOptions = computed(() => {
  const members = new Map((destinations.value?.data ?? []).map((member) => [member.id, member]));
  if (selectedMember.value) members.set(selectedMember.value.id, selectedMember.value);
  return getAnggotaOptions(
    [...members.values()].filter((member) => member.id !== props.source?.id),
  );
});
const {
  data: groups,
  status: groupStatus,
  error: groupError,
  refresh: refreshGroups,
} = useApi<{ data: { id: number; namaKelompok: string }[] }>("/api/v1/kelompok/options");
const groupOptions = computed(() => [
  { label: "Semua kelompok", value: "all" },
  ...(groups.value?.data.map((item) => ({ label: item.namaKelompok, value: item.id })) ?? []),
]);

watch(group, () => {
  selectedMember.value = undefined;
  search.value = "";
});
</script>

<template>
  <div class="space-y-3 border-t border-default pt-4">
    <h3 class="font-medium text-highlighted">Tujuan</h3>
    <UFormField
      v-if="conversion"
      label="Anggota Tujuan"
      name="idUserTujuan"
      description="Konversi tabungan ke saham dilakukan untuk anggota yang sama."
      required
    >
      <UInput
        :model-value="source ? `${source.name} · ${source.noAnggota}` : ''"
        placeholder="Pilih anggota sumber terlebih dahulu"
        readonly
        class="w-full"
      />
    </UFormField>
    <template v-else>
      <UFormField label="Kelompok Tujuan">
        <USelect
          v-model="group"
          :items="groupOptions"
          :loading="groupStatus === 'pending'"
          :disabled="groupStatus !== 'success' || disabled"
          class="w-full"
        />
      </UFormField>
      <UAlert
        v-if="groupError"
        title="Gagal Memuat Kelompok"
        color="error"
        variant="subtle"
        :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshGroups() }]"
      />
      <UFormField
        label="Anggota Tujuan"
        name="idUserTujuan"
        description="Cari nama atau nomor anggota; tujuan dapat berasal dari kelompok lain."
        required
      >
        <USelectMenu
          v-model="selectedId"
          v-model:search-term="search"
          :items="destinationOptions"
          value-key="value"
          placeholder="Pilih anggota tujuan"
          :search-input="{ placeholder: 'Cari nama atau nomor anggota...' }"
          :loading="destinationStatus === 'pending'"
          :disabled="disabled"
          ignore-filter
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
