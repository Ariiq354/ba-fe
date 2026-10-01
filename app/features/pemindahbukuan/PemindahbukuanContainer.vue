<script setup lang="ts">
import type { DropdownMenuItem, TabsItem } from "@nuxt/ui";
import type { Pemindahbukuan, PemindahbukuanResponse, TipePemindahbukuan } from "./model";
import type { AnggotaOptionsResponse, StatusMutasi } from "~/features/simpanan/model";
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { getAnggotaOptions, statusMutasiLabels, statusMutasiOptions } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { PEMINDAHBUKUAN_LIST_KEY, PEMINDAHBUKUAN_PENDING_KEY } from "./keys";
import ModalDetailPemindahbukuan from "./ModalDetailPemindahbukuan.vue";
import ModalPengajuanPemindahbukuan from "./ModalPengajuanPemindahbukuan.vue";
import ModalProsesPemindahbukuan from "./ModalProsesPemindahbukuan.vue";
import { canCancelPemindahbukuan, formatPemindahbukuanValue, pemindahbukuanColumns, tipePemindahbukuanOptions } from "./model";

const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const canView = computed(() => can(session.value.data?.user.role, "pemindahbukuan", "view"));
const canManage = computed(() => can(session.value.data?.user.role, "pemindahbukuan", "manage"));
const canViewApproval = computed(() => can(session.value.data?.user.role, "approvalPemindahbukuan", "view"));
const canApprove = computed(() => can(session.value.data?.user.role, "approvalPemindahbukuan", "manage"));
const tab = ref("history");
const page = ref(1);
const search = ref("");
const statusFilter = ref<"all" | StatusMutasi>("all");
const tipe = ref<"all" | TipePemindahbukuan>("all");
const selectedUserId = ref<number | "all">("all");
const approval = computed(() => canViewApproval.value && tab.value === "approval");
const queryStatus = computed(() => approval.value ? "pending" : statusFilter.value);
const targetUserId = computed(() => selectedUserId.value === "all" ? undefined : selectedUserId.value);
const limit = 10;

const { data: pending } = useNuxtData<Pick<PemindahbukuanResponse, "total">>(PEMINDAHBUKUAN_PENDING_KEY);
const tabs = computed<TabsItem[]>(() => [
  { label: "Riwayat", value: "history", icon: "i-tabler-history" },
  ...(canViewApproval.value ? [{ label: "Menunggu Persetujuan", value: "approval", icon: "i-tabler-checks", badge: pending.value?.total || undefined }] : []),
]);
watch(canViewApproval, (allowed) => {
  if (!allowed)
    tab.value = "history";
});
watch([search, queryStatus, tipe, targetUserId, tab], () => {
  page.value = 1;
}, { flush: "sync" });

const { data: members, status: membersStatus, error: membersError, refresh: refreshMembers } = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canView,
  watch: [canView],
});
const accessibleSourceIds = computed(() => members.value?.data.map(member => member.id) ?? []);
const memberOptions = computed(() => [{ label: "Semua anggota dalam cakupan", value: "all" }, ...getAnggotaOptions(members.value?.data ?? [])]);
const tipeOptions = [{ label: "Semua jenis", value: "all" }, ...tipePemindahbukuanOptions];
const { data, status, error, refresh } = useApi<PemindahbukuanResponse>("/api/v1/pemindahbukuan", {
  key: PEMINDAHBUKUAN_LIST_KEY,
  query: { page, limit, search, status: queryStatus, tipePemindahbukuan: tipe, userId: targetUserId },
  enabled: canView,
  watch: [canView],
});
const total = computed(() => data.value?.total ?? 0);

async function refreshList() {
  await refreshNuxtData(PEMINDAHBUKUAN_LIST_KEY);
  if (!error.value) {
    const lastPage = Math.max(1, Math.ceil(total.value / limit));
    if (page.value > lastPage) {
      page.value = lastPage;
      await nextTick();
      await refresh({ dedupe: "defer" });
    }
  }
}

function openForm() {
  if (canManage.value)
    openModal(ModalPengajuanPemindahbukuan, { refresh: refreshList });
}
function viewTransfer(transfer: Pemindahbukuan) {
  openModal(ModalDetailPemindahbukuan, { transfer });
}
function processTransfer(transfer: Pemindahbukuan, action: "approve" | "reject" | "cancel") {
  if (status.value === "pending" || transfer.statusApproved !== "pending")
    return;
  if (action === "cancel" ? !canManage.value || !canCancelPemindahbukuan(transfer, actorId.value, accessibleSourceIds.value) : !canApprove.value)
    return;
  openModal(ModalProsesPemindahbukuan, { transfer, action, accessibleSourceIds: accessibleSourceIds.value, refresh: refreshList });
}
function getDropdownItems(transfer: Pemindahbukuan): DropdownMenuItem[] {
  if (transfer.statusApproved !== "pending")
    return [];
  return [
    ...(approval.value && canApprove.value
      ? [
          { label: "Setujui", icon: "i-tabler-check", onSelect: () => processTransfer(transfer, "approve") },
          { label: "Tolak", icon: "i-tabler-x", color: "error" as const, onSelect: () => processTransfer(transfer, "reject") },
        ]
      : []),
    ...(!approval.value && canManage.value && canCancelPemindahbukuan(transfer, actorId.value, accessibleSourceIds.value)
      ? [{ label: "Batalkan Pengajuan", icon: "i-tabler-ban", color: "warning" as const, onSelect: () => processTransfer(transfer, "cancel") }]
      : []),
  ];
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Pemindahbukuan
        </h1>
        <p class="mt-1 text-sm text-muted">
          Pindahkan tabungan atau saham antaranggota, atau konversikan tabungan menjadi saham.
        </p>
      </div>
      <UButton v-if="canManage" icon="i-tabler-plus" class="justify-center" @click="openForm">
        Ajukan Pemindahbukuan
      </UButton>
    </div>
    <UTabs v-if="canViewApproval" v-model="tab" :items="tabs" :content="false" class="w-full sm:w-fit" />
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <InputSearch v-model="search" placeholder="Cari kode transaksi..." aria-label="Cari pemindahbukuan" />
          <USelectMenu v-model="selectedUserId" :items="memberOptions" value-key="value" :loading="membersStatus === 'pending'" :disabled="membersStatus !== 'success'" aria-label="Filter anggota" class="w-full lg:w-80" />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <USelect v-model="tipe" :items="tipeOptions" aria-label="Filter jenis pemindahbukuan" class="w-full" />
          <USelect v-if="!approval" v-model="statusFilter" :items="statusMutasiOptions" aria-label="Filter status pemindahbukuan" class="w-full" />
        </div>
        <UAlert v-if="membersError" title="Gagal Memuat Pilihan Anggota" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]" />
        <UAlert v-if="error" title="Gagal Memuat Pemindahbukuan" description="Riwayat belum dapat dimuat. Silakan coba lagi." color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: refreshList }]" />
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
                {{ approval ? 'Tidak ada pemindahbukuan yang menunggu persetujuan' : 'Tidak ada pemindahbukuan' }}
              </p>
              <p class="mt-1 text-sm text-muted">
                Coba filter lain atau ajukan pemindahbukuan baru.
              </p>
            </div>
          </template>
        </DataTable>
      </div>
    </UCard>
  </div>
</template>
