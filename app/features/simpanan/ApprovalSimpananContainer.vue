<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { AnggotaOptionsResponse, MutasiResponse, MutasiSimpanan, StatusMutasi } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { authClient, can } from "~/utils/auth";
import ModalDetailMutasi from "./components/ModalDetailMutasi.vue";
import ModalProsesMutasi from "./components/ModalProsesMutasi.vue";
import { getAnggotaOptions, jenisSimpananOptions, jenisTransaksiOptions, mutasiColumns, statusMutasiLabels } from "./model";

const page = ref(1);
const search = ref("");
const jenisSimpanan = ref<"all" | "tabungan" | "saham">("all");
const jenisTransaksi = ref<"all" | "setoran" | "penarikan">("all");
const selectedUserId = ref<number | "all">("all");
const limit = 10;
const session = authClient.useSession();
const canView = computed(() => can(session.value.data?.user.role, "approvalSimpanan", "view"));
const canApprove = computed(() => can(session.value.data?.user.role, "approvalSimpanan", "manage"));

const { data: members, status: membersStatus, error: membersError, refresh: refreshMembers } = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canView,
  watch: [canView],
});
const memberOptions = computed(() => [{ label: "Semua anggota", value: "all" }, ...getAnggotaOptions(members.value?.data ?? [])]);
const targetUserId = computed(() => selectedUserId.value === "all" ? undefined : selectedUserId.value);

watch([search, jenisSimpanan, jenisTransaksi, targetUserId], () => {
  page.value = 1;
}, { flush: "sync" });

const { data, status, error, refresh } = useApi<MutasiResponse>("/api/v1/simpanan/mutasi", {
  query: { page, limit, search, status: "pending", jenisSimpanan, jenisTransaksi, userId: targetUserId },
  enabled: canView,
  watch: [canView],
});
const total = computed(() => data.value?.total ?? 0);

const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });

function viewMutasi(mutasi: MutasiSimpanan) {
  openModal(ModalDetailMutasi, { mutasi });
}

function processMutasi(mutasi: MutasiSimpanan, action: "approve" | "reject") {
  if (status.value === "pending" || mutasi.statusApproved !== "pending" || !canApprove.value)
    return;
  openModal(ModalProsesMutasi, { mutasi, action, refresh: refreshList });
}

function getDropdownItems(mutasi: MutasiSimpanan): DropdownMenuItem[] {
  if (mutasi.statusApproved !== "pending" || !canApprove.value)
    return [];
  return [
    { label: "Setujui", icon: "i-tabler-check", onSelect: () => processMutasi(mutasi, "approve") },
    { label: "Tolak", icon: "i-tabler-x", color: "error", onSelect: () => processMutasi(mutasi, "reject") },
  ];
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Approval Simpanan
      </h1>
      <p class="mt-1 text-sm text-muted">
        Tinjau pengajuan simpanan yang menunggu persetujuan, lalu setujui atau tolak.
      </p>
    </div>
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <InputSearch v-model="search" placeholder="Cari kode transaksi..." aria-label="Cari approval simpanan" />
          <USelectMenu v-model="selectedUserId" :items="memberOptions" value-key="value" :loading="membersStatus === 'pending'" :disabled="membersStatus !== 'success'" aria-label="Filter anggota" class="w-full lg:w-80" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <USelect v-model="jenisSimpanan" :items="jenisSimpananOptions" aria-label="Filter jenis simpanan" class="w-full" />
          <USelect v-model="jenisTransaksi" :items="jenisTransaksiOptions" aria-label="Filter jenis transaksi" class="w-full" />
        </div>
        <UAlert v-if="membersError" title="Gagal Memuat Pilihan Anggota" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]" />
        <UAlert v-if="error" title="Gagal Memuat Approval Simpanan" description="Pengajuan belum dapat dimuat. Silakan coba lagi." color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: refreshList }]" />
        <DataTable
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :columns="mutasiColumns"
          :loading="status === 'pending'"
          :total="total"
          :dropdown-items="getDropdownItems"
          viewable
          enumerate
          pagination
          @view="viewMutasi"
        >
          <template #kodeTransaksi-cell="{ row }">
            <UButton color="neutral" variant="link" class="p-0 font-mono" @click="viewMutasi(row.original)">
              {{ row.original.kodeTransaksi }}
            </UButton>
          </template>
          <template #statusApproved-cell="{ row }">
            <UBadge :color="statusMutasiLabels[row.original.statusApproved as StatusMutasi].color" variant="subtle">
              {{ statusMutasiLabels[row.original.statusApproved as StatusMutasi].label }}
            </UBadge>
          </template>
          <template #empty>
            <div class="py-8 text-center">
              <UIcon name="i-tabler-wallet" class="mb-2 size-8 text-dimmed" />
              <p class="font-medium text-highlighted">
                Tidak ada pengajuan yang menunggu persetujuan
              </p>
              <p class="mt-1 text-sm text-muted">
                Coba kata kunci atau filter lain untuk melihat pengajuan.
              </p>
            </div>
          </template>
        </DataTable>
      </div>
    </UCard>
  </div>
</template>
