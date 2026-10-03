<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Pemindahbukuan, PemindahbukuanResponse, TipePemindahbukuan } from "./model";
import type { AnggotaOptionsResponse, StatusMutasi } from "~/features/simpanan/model";
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { getAnggotaOptions, statusMutasiLabels } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { PEMINDAHBUKUAN_APPROVAL_LIST_KEY } from "./keys";
import ModalDetailPemindahbukuan from "./ModalDetailPemindahbukuan.vue";
import ModalProsesPemindahbukuan from "./ModalProsesPemindahbukuan.vue";
import { formatPemindahbukuanValue, pemindahbukuanColumns, tipePemindahbukuanOptions } from "./model";

const session = authClient.useSession();
const canView = computed(() => can(session.value.data?.user.role, "approvalPemindahbukuan", "view"));
const canApprove = computed(() => can(session.value.data?.user.role, "approvalPemindahbukuan", "manage"));
const page = ref(1);
const search = ref("");
const tipe = ref<"all" | TipePemindahbukuan>("all");
const selectedUserId = ref<number | "all">("all");
const targetUserId = computed(() => selectedUserId.value === "all" ? undefined : selectedUserId.value);
const limit = 10;

watch([search, tipe, targetUserId], () => {
  page.value = 1;
}, { flush: "sync" });

const { data: members, status: membersStatus, error: membersError, refresh: refreshMembers } = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canView,
  watch: [canView],
});
const memberOptions = computed(() => [{ label: "Semua anggota", value: "all" }, ...getAnggotaOptions(members.value?.data ?? [])]);
const tipeOptions = [{ label: "Semua jenis", value: "all" }, ...tipePemindahbukuanOptions];
const { data, status, error, refresh } = useApi<PemindahbukuanResponse>("/api/v1/pemindahbukuan", {
  key: PEMINDAHBUKUAN_APPROVAL_LIST_KEY,
  query: { page, limit, search, status: "pending", tipePemindahbukuan: tipe, userId: targetUserId },
  enabled: canView,
  watch: [canView],
});
const total = computed(() => data.value?.total ?? 0);

const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });

function viewTransfer(transfer: Pemindahbukuan) {
  openModal(ModalDetailPemindahbukuan, { transfer });
}

function processTransfer(transfer: Pemindahbukuan, action: "approve" | "reject") {
  if (status.value === "pending" || transfer.statusApproved !== "pending" || !canApprove.value)
    return;
  openModal(ModalProsesPemindahbukuan, { transfer, action, refresh: refreshList });
}

function getDropdownItems(transfer: Pemindahbukuan): DropdownMenuItem[] {
  if (transfer.statusApproved !== "pending" || !canApprove.value)
    return [];
  return [
    { label: "Setujui", icon: "i-tabler-check", onSelect: () => processTransfer(transfer, "approve") },
    { label: "Tolak", icon: "i-tabler-x", color: "error", onSelect: () => processTransfer(transfer, "reject") },
  ];
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Approval Pemindahbukuan
      </h1>
      <p class="mt-1 text-sm text-muted">
        Tinjau pengajuan pemindahbukuan yang menunggu persetujuan, lalu setujui atau tolak.
      </p>
    </div>
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <InputSearch v-model="search" placeholder="Cari kode transaksi..." aria-label="Cari approval pemindahbukuan" />
          <USelectMenu v-model="selectedUserId" :items="memberOptions" value-key="value" :loading="membersStatus === 'pending'" :disabled="membersStatus !== 'success'" aria-label="Filter anggota" class="w-full lg:w-80" />
        </div>
        <USelect v-model="tipe" :items="tipeOptions" aria-label="Filter jenis pemindahbukuan" class="w-full" />
        <UAlert v-if="membersError" title="Gagal Memuat Pilihan Anggota" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]" />
        <UAlert v-if="error" title="Gagal Memuat Approval Pemindahbukuan" description="Pengajuan belum dapat dimuat. Silakan coba lagi." color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: refreshList }]" />
        <DataTable
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :columns="pemindahbukuanColumns"
          :loading="status === 'pending'"
          :total="total"
          :dropdown-items="getDropdownItems"
          viewable
          enumerate
          pagination
          @view="viewTransfer"
        >
          <template #kodeTransaksi-cell="{ row }">
            <UButton color="neutral" variant="link" class="p-0 font-mono" @click="viewTransfer(row.original)">
              {{ row.original.kodeTransaksi }}
            </UButton>
          </template>
          <template #members-cell="{ row }">
            <p class="font-medium">
              {{ row.original.sourceMemberName }}
            </p>
            <p class="text-sm text-muted">
              → {{ row.original.destinationMemberName }}
            </p>
          </template>
          <template #nominal-cell="{ row }">
            <p class="font-medium">
              {{ formatPemindahbukuanValue(row.original) }}
            </p>
            <p v-if="row.original.tipePemindahbukuan !== 'tabungan_ke_tabungan'" class="text-sm text-muted">
              {{ row.original.tipePemindahbukuan === 'saham_ke_saham' ? 'Referensi: ' : '' }}{{ formatRupiah(row.original.nominal) }}
            </p>
          </template>
          <template #statusApproved-cell="{ row }">
            <UBadge :color="statusMutasiLabels[row.original.statusApproved as StatusMutasi].color" variant="subtle">
              {{ statusMutasiLabels[row.original.statusApproved as StatusMutasi].label }}
            </UBadge>
          </template>
          <template #empty>
            <div class="py-8 text-center">
              <UIcon name="i-tabler-transfer" class="mb-2 size-8 text-dimmed" />
              <p class="font-medium text-highlighted">
                Tidak ada pemindahbukuan yang menunggu persetujuan
              </p>
              <p class="mt-1 text-sm text-muted">
                Coba filter lain untuk melihat pengajuan.
              </p>
            </div>
          </template>
        </DataTable>
      </div>
    </UCard>
  </div>
</template>
