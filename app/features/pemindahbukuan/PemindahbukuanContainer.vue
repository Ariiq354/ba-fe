<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Pemindahbukuan, PemindahbukuanResponse, TipePemindahbukuan } from "./model";
import type { AnggotaOptionsResponse, StatusMutasi } from "~/features/simpanan/model";
import InputSearch from "~/components/input/InputSearch.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { getAnggotaOptions, statusMutasiOptions } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import ModalDetailPemindahbukuan from "./components/ModalDetailPemindahbukuan.vue";
import ModalPengajuanPemindahbukuan from "./components/ModalPengajuanPemindahbukuan.vue";
import ModalProsesPemindahbukuan from "./components/ModalProsesPemindahbukuan.vue";
import TabelPemindahbukuan from "./components/TabelPemindahbukuan.vue";
import { PEMINDAHBUKUAN_LIST_KEY } from "./data";
import { canCancelPemindahbukuan, tipePemindahbukuanOptions } from "./model";

const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const canView = computed(() => can(session.value.data?.user.role, "pemindahbukuan", "view"));
const canManage = computed(() => can(session.value.data?.user.role, "pemindahbukuan", "manage"));
const page = ref(1);
const search = ref("");
const statusFilter = ref<"all" | StatusMutasi>("all");
const tipe = ref<"all" | TipePemindahbukuan>("all");
const selectedUserId = ref<number | "all">("all");
const targetUserId = computed(() =>
  selectedUserId.value === "all" ? undefined : selectedUserId.value,
);
const limit = 10;

watch(
  [search, statusFilter, tipe, targetUserId],
  () => {
    page.value = 1;
  },
  { flush: "sync" },
);

const {
  data: members,
  status: membersStatus,
  error: membersError,
  refresh: refreshMembers,
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canView,
  watch: [canView],
});
const accessibleSourceIds = computed(() => members.value?.data.map((member) => member.id) ?? []);
const memberOptions = computed(() => [
  { label: "Semua anggota dalam cakupan", value: "all" },
  ...getAnggotaOptions(members.value?.data ?? []),
]);
const tipeOptions = [{ label: "Semua jenis", value: "all" }, ...tipePemindahbukuanOptions];
const { data, status, error, refresh } = useApi<PemindahbukuanResponse>("/api/v1/pemindahbukuan", {
  key: PEMINDAHBUKUAN_LIST_KEY,
  query: {
    page,
    limit,
    search,
    status: statusFilter,
    tipePemindahbukuan: tipe,
    userId: targetUserId,
  },
  enabled: canView,
  watch: [canView],
});
const total = computed(() => data.value?.total ?? 0);

const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });

function openForm() {
  if (canManage.value) openModal(ModalPengajuanPemindahbukuan, { refresh: refreshList });
}
function viewTransfer(transfer: Pemindahbukuan) {
  openModal(ModalDetailPemindahbukuan, { transfer });
}
function cancelTransfer(transfer: Pemindahbukuan) {
  if (status.value === "pending" || transfer.statusApproved !== "pending") return;
  if (
    !canManage.value ||
    !canCancelPemindahbukuan(transfer, actorId.value, accessibleSourceIds.value)
  )
    return;
  openModal(ModalProsesPemindahbukuan, {
    transfer,
    action: "cancel",
    accessibleSourceIds: accessibleSourceIds.value,
    refresh: refreshList,
  });
}
function getDropdownItems(transfer: Pemindahbukuan): DropdownMenuItem[] {
  if (
    !canManage.value ||
    !canCancelPemindahbukuan(transfer, actorId.value, accessibleSourceIds.value)
  )
    return [];
  return [
    {
      label: "Batalkan Pengajuan",
      icon: "i-tabler-ban",
      color: "warning",
      onSelect: () => cancelTransfer(transfer),
    },
  ];
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-xl font-semibold text-highlighted">Pemindahbukuan</h1>
        <p class="mt-1 text-sm text-muted">
          Pindahkan tabungan atau saham antaranggota, atau konversikan tabungan menjadi saham.
        </p>
      </div>
      <UButton v-if="canManage" icon="i-tabler-plus" class="justify-center" @click="openForm">
        Ajukan pemindahbukuan
      </UButton>
    </div>
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <InputSearch
            v-model="search"
            placeholder="Cari kode transaksi..."
            aria-label="Cari pemindahbukuan"
          />
          <USelectMenu
            v-model="selectedUserId"
            :items="memberOptions"
            value-key="value"
            :loading="membersStatus === 'pending'"
            :disabled="membersStatus !== 'success'"
            aria-label="Filter anggota"
            class="w-full lg:w-80"
          />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <USelect
            v-model="tipe"
            :items="tipeOptions"
            aria-label="Filter jenis pemindahbukuan"
            class="w-full"
          />
          <USelect
            v-model="statusFilter"
            :items="statusMutasiOptions"
            aria-label="Filter status pemindahbukuan"
            class="w-full"
          />
        </div>
        <UAlert
          v-if="membersError"
          title="Gagal Memuat Pilihan Anggota"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]"
        />
        <UAlert
          v-if="error"
          title="Gagal Memuat Pemindahbukuan"
          description="Riwayat belum dapat dimuat. Silakan coba lagi."
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: refreshList }]"
        />
        <TabelPemindahbukuan
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :loading="status === 'pending'"
          :total="total"
          :dropdown-items="getDropdownItems"
          @view="viewTransfer"
        />
      </div>
    </UCard>
  </div>
</template>
