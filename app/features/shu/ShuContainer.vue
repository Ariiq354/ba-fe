<script setup lang="ts">
import type { AnggotaOptionsResponse } from "~/features/simpanan/model";
import type { ReferensiShu, ShuResponse } from "./model";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { getAnggotaOptions } from "~/features/simpanan/model";
import { authClient } from "~/utils/auth";
import ModalGenerateShu from "./components/ModalGenerateShu.vue";
import ModalPengalihanShu from "./components/ModalPengalihanShu.vue";
import { shuColumns } from "./model";

const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const isAdmin = computed(() => session.value.data?.user.role === "admin");
const isLoggedIn = computed(() => Number.isInteger(actorId.value) && actorId.value > 0);
const tahun = ref(new Date().getFullYear());
const selection = ref<number>();

const {
  data: members,
  status: membersStatus,
  error: membersError,
  refresh: refreshMembers,
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: isAdmin,
  watch: [isAdmin],
});
const memberOptions = computed(() => [
  { label: `${session.value.data?.user.name ?? "Saya"} (Saya)`, value: actorId.value },
  ...getAnggotaOptions(members.value?.data ?? []).filter(
    (member) => member.value !== actorId.value,
  ),
]);
const userId = computed({
  get: () => (isAdmin.value ? (selection.value ?? actorId.value) : actorId.value),
  set: (value: number) => {
    if (
      isAdmin.value &&
      memberOptions.value.some(
        (member) => member.value === value && !("disabled" in member && member.disabled),
      )
    ) {
      selection.value = value;
    }
  },
});
watch([actorId, isAdmin], () => {
  selection.value = undefined;
});

const { data, status, error, refresh } = useApi<ShuResponse>("/api/v1/shu", {
  enabled: isLoggedIn,
  query: { tahun, userId },
});
const {
  data: referensi,
  status: referensiStatus,
  error: referensiError,
  refresh: refreshReferensi,
} = useApi<ReferensiShu>("/api/v1/shu/referensi", {
  enabled: isAdmin,
  query: { tahun },
});
const currentReferensi = computed(() =>
  isAdmin.value && referensiStatus.value === "success" && referensi.value?.tahun === tahun.value
    ? referensi.value
    : undefined,
);
const canGenerate = computed(
  () =>
    !!currentReferensi.value &&
    !currentReferensi.value.sudahDibagikan &&
    currentReferensi.value.batasShu > 0,
);
const canTransfer = computed(
  () => !!currentReferensi.value?.sudahDibagikan && !currentReferensi.value.sudahDialihkan,
);

function updateTahun(value: number) {
  if (Number.isInteger(value) && value >= 1 && value <= 9999) tahun.value = value;
}

async function refreshAfterChange() {
  await Promise.all([refresh(), refreshReferensi()]);
}

function generateShu() {
  if (!canGenerate.value || !currentReferensi.value) return;
  openModal(ModalGenerateShu, { referensi: currentReferensi.value, refresh: refreshAfterChange });
}

function transferShu() {
  if (!canTransfer.value || !currentReferensi.value) return;
  openModal(ModalPengalihanShu, { referensi: currentReferensi.value, refresh: refreshAfterChange });
}
</script>

<template>
  <div class="min-w-0 space-y-6">
    <h1 class="text-2xl font-semibold text-highlighted">Bagi Hasil Usaha</h1>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
      <UFormField label="Tahun">
        <UInputNumber
          :model-value="tahun"
          :min="1"
          :max="9999"
          :step="1"
          :format-options="{ useGrouping: false, maximumFractionDigits: 0 }"
          aria-label="Filter tahun SHU"
          class="w-40"
          @update:model-value="updateTahun"
        />
      </UFormField>
      <UFormField v-if="isAdmin" label="Anggota" class="w-full sm:max-w-sm">
        <USelectMenu
          v-model="userId"
          :items="memberOptions"
          value-key="value"
          :loading="membersStatus === 'pending'"
          :disabled="membersStatus !== 'success'"
          placeholder="Pilih anggota"
          aria-label="Pilih anggota SHU"
          class="w-full"
        />
      </UFormField>
    </div>
    <UAlert
      v-if="isAdmin && membersError"
      title="Gagal Memuat Pilihan Anggota"
      color="error"
      variant="subtle"
      :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]"
    />
    <div v-if="isAdmin" class="flex flex-wrap gap-3">
      <UButton icon="i-tabler-calculator" :disabled="!canGenerate" @click="generateShu">
        Generate SHU
      </UButton>
      <UButton icon="i-tabler-wallet" :disabled="!canTransfer" @click="transferShu">
        Alihkan ke Tabungan
      </UButton>
    </div>
    <UAlert
      v-if="isAdmin && referensiError"
      title="Gagal Memuat Referensi SHU"
      color="error"
      variant="subtle"
      :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshReferensi() }]"
    />
    <UCard>
      <UAlert
        v-if="error"
        title="Gagal Memuat SHU"
        color="error"
        variant="subtle"
        :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refresh() }]"
      />
      <DataTable
        v-else
        :data="status === 'success' ? (data?.data ?? []) : []"
        :columns="shuColumns"
        :loading="status === 'pending' || !isLoggedIn"
      >
        <template #empty>
          <p class="py-8 text-center text-muted">Belum ada SHU untuk tahun ini.</p>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
