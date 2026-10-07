<script setup lang="ts">
import type { Pengguna, PenggunaResponse, RolePengguna, StatusPenggunaFilter } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { IMAGE_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import ModalDetailPengguna from "./components/ModalDetailPengguna.vue";
import { canChangePenggunaRole, formatPenggunaRole, getPenggunaStatus, penggunaColumns, rolePenggunaOptions, rolePenggunaSchema, statusFilterOptions, statusPenggunaLabels } from "./model";

const page = ref(1);
const search = ref("");
const statusFilter = ref<StatusPenggunaFilter>("all");
const limit = 10;
const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "pengguna", "manage"));
const pendingRoles = ref<Partial<Record<number, RolePengguna>>>({});

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

function viewPengguna(pengguna: Pengguna) {
  openModal(ModalDetailPengguna, { pengguna, refresh: refreshList });
}

function getRoleOptions(pengguna: Pengguna) {
  return rolePenggunaOptions.map(option => ({
    ...option,
    disabled: !canChangePenggunaRole(pengguna, option.value),
  }));
}

async function setPenggunaRole(pengguna: Pengguna, value: unknown) {
  const result = rolePenggunaSchema.safeParse(value);
  if (!result.success || !canManage.value || pendingRoles.value[pengguna.id] || status.value === "pending")
    return;
  const role = result.data;
  if (role === (pengguna.role ?? "user") || !canChangePenggunaRole(pengguna, role))
    return;

  pendingRoles.value[pengguna.id] = role;
  try {
    const { error } = await authClient.admin.setRole({
      userId: String(pengguna.id),
      role,
    });
    if (error)
      throw new Error(error.message || "Role pengguna gagal diubah.");
  }
  catch (error) {
    useToastError("Gagal Mengubah Role", extractErrorMessage(error, "Role pengguna gagal diubah. Silakan coba lagi."));
    delete pendingRoles.value[pengguna.id];
    return;
  }

  pengguna.role = role;
  useToastSuccess("Role Berhasil Diubah", `${pengguna.name} sekarang menjadi ${formatPenggunaRole(role)}.`);
  try {
    if (String(session.value.data?.user.id) === String(pengguna.id))
      await session.value.refetch();
    await refreshList();
  }
  catch {
    useToastError("Gagal Memuat Ulang Data", "Role sudah tersimpan, tetapi data terbaru belum dapat dimuat. Silakan muat ulang halaman.");
  }
  finally {
    delete pendingRoles.value[pengguna.id];
  }
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
          Lihat profil pengguna, verifikasi pendaftaran, dan kelola role pengguna.
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
            <div class="flex items-center gap-3">
              <UAvatar
                :src="row.original.image ? `${IMAGE_URL}/${row.original.image}` : undefined"
                :alt="row.original.name"
                size="lg"
                loading="lazy"
              />
              <div class="space-y-0.5">
                <p class="font-medium">
                  {{ row.original.name }}
                </p>
                <p v-if="row.original.username" class="text-sm text-muted">
                  @{{ row.original.username }}
                </p>
              </div>
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
          <template #role-cell="{ row }">
            <USelect
              v-if="canManage"
              :model-value="pendingRoles[row.original.id] ?? row.original.role ?? 'user'"
              :items="getRoleOptions(row.original)"
              :loading="!!pendingRoles[row.original.id]"
              :disabled="status === 'pending' || !!pendingRoles[row.original.id] || row.original.banned === true"
              :aria-label="`Role ${row.original.name}`"
              size="sm"
              class="w-40"
              @update:model-value="setPenggunaRole(row.original, $event)"
            />
            <span v-else>{{ formatPenggunaRole(row.original.role) }}</span>
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
              :icon="canManage && getPenggunaStatus(row.original) === 'pending' ? 'i-tabler-user-check' : 'i-tabler-eye'"
              :color="canManage && getPenggunaStatus(row.original) === 'pending' ? 'primary' : 'neutral'"
              size="sm"
              variant="soft"
              :disabled="status === 'pending'"
              @click="viewPengguna(row.original)"
            >
              {{ canManage && getPenggunaStatus(row.original) === 'pending' ? 'Verifikasi' : 'Lihat Profil' }}
            </UButton>
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
