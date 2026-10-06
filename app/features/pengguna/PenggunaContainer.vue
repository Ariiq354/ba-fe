<script setup lang="ts">
import type { Pengguna, PenggunaResponse, StatusPenggunaFilter } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { authClient, can } from "~/utils/auth";
import ModalPjPengguna from "./components/ModalPjPengguna.vue";
import ModalVerifikasiPengguna from "./components/ModalVerifikasiPengguna.vue";
import { canSetPenggunaPj, getPenggunaStatus, isPenggunaPj, penggunaColumns, statusFilterOptions, statusPenggunaLabels } from "./model";

const page = ref(1);
const search = ref("");
const statusFilter = ref<StatusPenggunaFilter>("all");
const limit = 10;
const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "pengguna", "manage"));

watch([search, statusFilter], () => {
  page.value = 1;
}, { flush: "sync" });

const { data, status, error, refresh } = useApi<PenggunaResponse>("/api/v1/pengguna", {
  query: { page, limit, search, status: statusFilter },
});
const total = computed(() => data.value?.total ?? 0);

async function refreshList() {
  await refresh();
  if (!error.value) {
    page.value = Math.min(page.value, Math.max(1, Math.ceil(total.value / limit)));
  }
}

function verifyPengguna(pengguna: Pengguna) {
  if (!canManage.value || getPenggunaStatus(pengguna) !== "pending")
    return;
  openModal(ModalVerifikasiPengguna, { pengguna, refresh: refreshList });
}

function setPenggunaPj(pengguna: Pengguna) {
  if (!canManage.value || !canSetPenggunaPj(pengguna))
    return;
  openModal(ModalPjPengguna, { pengguna, refresh: refreshList });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Daftar Pengguna
        </h1>
        <p class="mt-1 text-sm text-muted">
          Lihat data pengguna, verifikasi pendaftaran, dan kelola PJ kelompok.
        </p>
      </div>
    </div>

    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 sm:flex-row">
          <InputSearch v-model="search" placeholder="Cari nama, email, atau nomor anggota..." aria-label="Cari pengguna" />
          <USelect
            v-model="statusFilter"
            :items="statusFilterOptions"
            aria-label="Filter status pengguna"
            class="w-full sm:w-56"
          />
        </div>

        <UAlert
          v-if="error"
          title="Gagal Memuat Pengguna"
          description="Data pengguna belum dapat dimuat. Silakan coba lagi."
          color="error"
          variant="subtle"
          icon="i-tabler-alert-circle"
          :actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: refreshList }]"
        />

        <DataTable
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :columns="penggunaColumns"
          :loading="status === 'pending'"
          :total="total"
          enumerate
          pagination
        >
          <template #name-cell="{ row }">
            <div class="space-y-0.5">
              <p class="font-medium">
                {{ row.original.name }}
              </p>
              <p v-if="row.original.username" class="text-sm text-muted">
                @{{ row.original.username }}
              </p>
              <p class="text-xs text-muted">
                {{ row.original.email }}
              </p>
            </div>
          </template>
          <template #noAnggota-cell="{ row }">
            <span class="font-mono">{{ row.original.noAnggota || '—' }}</span>
          </template>
          <template #kelompok-cell="{ row }">
            <div>
              <p>{{ row.original.namaKelompok }}</p>
              <p class="text-xs text-muted">
                {{ row.original.kodeKelompok }}
              </p>
            </div>
          </template>
          <template #status-cell="{ row }">
            <div class="space-y-1">
              <UBadge :color="statusPenggunaLabels[getPenggunaStatus(row.original)].color" variant="subtle">
                {{ statusPenggunaLabels[getPenggunaStatus(row.original)].label }}
              </UBadge>
              <p v-if="getPenggunaStatus(row.original) === 'banned' && row.original.banReason" class="max-w-xs text-xs text-muted whitespace-normal">
                {{ row.original.banReason }}
              </p>
            </div>
          </template>
          <template #pengelolaan-cell="{ row }">
            <UButton
              v-if="canManage && getPenggunaStatus(row.original) === 'pending'"
              icon="i-tabler-user-check"
              size="sm"
              variant="soft"
              :disabled="status === 'pending'"
              @click="verifyPengguna(row.original)"
            >
              Verifikasi
            </UButton>
            <UButton
              v-else-if="canManage && canSetPenggunaPj(row.original)"
              :icon="isPenggunaPj(row.original) ? 'i-tabler-user-minus' : 'i-tabler-users-group'"
              :color="isPenggunaPj(row.original) ? 'warning' : 'primary'"
              size="sm"
              variant="soft"
              :disabled="status === 'pending'"
              @click="setPenggunaPj(row.original)"
            >
              {{ isPenggunaPj(row.original) ? 'Lepas PJ' : 'Jadikan PJ Kelompok' }}
            </UButton>
            <span v-else class="text-muted">—</span>
          </template>
          <template #empty>
            <div class="py-8 text-center">
              <UIcon name="i-tabler-users" class="mb-2 size-8 text-dimmed" />
              <p class="font-medium text-highlighted">
                {{ search || statusFilter !== 'all' ? 'Tidak ada pengguna yang sesuai' : 'Belum ada pengguna' }}
              </p>
              <p class="mt-1 text-sm text-muted">
                {{ search || statusFilter !== 'all' ? 'Coba kata kunci atau status lain.' : 'Pengguna yang mendaftar akan tampil di sini.' }}
              </p>
            </div>
          </template>
        </DataTable>
      </div>
    </UCard>
  </div>
</template>
