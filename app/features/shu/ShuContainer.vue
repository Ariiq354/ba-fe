<script setup lang="ts">
import type { AnggotaOptionsResponse } from "~/features/simpanan/model";
import type { ShuResponse } from "./model";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { getAnggotaOptions } from "~/features/simpanan/model";
import { authClient } from "~/utils/auth";
import { shuColumns } from "./model";

const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const isAdmin = computed(() => session.value.data?.user.role === "admin");
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
  query: { tahun, userId },
});
function updateTahun(value: number) {
  if (Number.isInteger(value) && value >= 1 && value <= 9999) tahun.value = value;
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
        :loading="status === 'pending'"
      >
        <template #empty>
          <p class="py-8 text-center text-muted">Belum ada SHU untuk tahun ini.</p>
        </template>
      </DataTable>
    </UCard>
  </div>
</template>
