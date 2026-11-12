<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Angsuran, AngsuranAction, AngsuranResponse } from "./model";
import type { StatusMutasi } from "~/features/simpanan/model";
import InputSearch from "~/components/input/InputSearch.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { PAGE_SIZE } from "~/constants";
import { statusMutasiOptions } from "~/features/simpanan/model";
import { authClient } from "~/utils/auth";
import ModalDetailAngsuran from "./components/ModalDetailAngsuran.vue";
import ModalPengajuanAngsuran from "./components/ModalPengajuanAngsuran.vue";
import ModalProsesAngsuran from "./components/ModalProsesAngsuran.vue";
import TabelAngsuran from "./components/TabelAngsuran.vue";
import { ANGSURAN_APPROVAL_LIST_KEY, ANGSURAN_LIST_KEY, refreshAngsuranData } from "./data";
import { canCancelAngsuran } from "./model";

const props = withDefaults(defineProps<{ approval?: boolean }>(), { approval: false });
const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const page = ref(1);
const search = ref("");
const statusFilter = ref<"all" | StatusMutasi>("all");
const limit = PAGE_SIZE;
const listKey = props.approval ? ANGSURAN_APPROVAL_LIST_KEY : ANGSURAN_LIST_KEY;
watch(
  [search, statusFilter],
  () => {
    page.value = 1;
  },
  { flush: "sync" },
);

const { data, status, error, refresh } = useApi<AngsuranResponse>("/api/v1/angsuran", {
  key: listKey,
  query: { page, limit, search, status: statusFilter },
});
const total = computed(() => data.value?.total ?? 0);
const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });

async function refreshData(userId: number) {
  await Promise.all([refreshList(), refreshAngsuranData(userId)]);
}
function openForm() {
  openModal(ModalPengajuanAngsuran, {
    refresh: refreshData,
  });
}
function viewAngsuran(item: Angsuran) {
  openModal(ModalDetailAngsuran, { angsuran: item });
}
function processAngsuran(item: Angsuran, action: AngsuranAction) {
  if (status.value !== "success" || item.statusApproved !== "pending") return;
  if (
    action === "cancel"
      ? props.approval || !canCancelAngsuran(item, actorId.value)
      : !props.approval
  )
    return;
  openModal(ModalProsesAngsuran, { angsuran: item, action, refresh: refreshData });
}
function getDropdownItems(item: Angsuran): DropdownMenuItem[] {
  if (status.value !== "success" || item.statusApproved !== "pending") return [];
  if (props.approval)
    return [
      {
        label: "Setujui",
        icon: "i-tabler-check",
        onSelect: () => processAngsuran(item, "approve"),
      },
      {
        label: "Tolak",
        icon: "i-tabler-x",
        color: "error",
        onSelect: () => processAngsuran(item, "reject"),
      },
    ];
  return canCancelAngsuran(item, actorId.value)
    ? [
        {
          label: "Batalkan Pengajuan",
          icon: "i-tabler-ban",
          color: "warning",
          onSelect: () => processAngsuran(item, "cancel"),
        },
      ]
    : [];
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          {{ approval ? "Daftar Angsuran" : "Angsuran" }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{
            approval
              ? "Tinjau pengajuan angsuran untuk disetujui atau ditolak."
              : "Ajukan angsuran dan pantau status pembayaran pembiayaan."
          }}
        </p>
      </div>
      <UButton v-if="!approval" icon="i-tabler-plus" class="justify-center" @click="openForm"
        >Ajukan Angsuran</UButton
      >
    </div>
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <InputSearch
            v-model="search"
            placeholder="Cari kode transaksi..."
            aria-label="Cari angsuran"
          />
          <USelect
            v-model="statusFilter"
            :items="statusMutasiOptions"
            aria-label="Filter status angsuran"
            class="w-full lg:w-48"
          />
        </div>
        <UAlert
          v-if="error"
          title="Gagal Memuat Angsuran"
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: refreshList }]"
        />
        <TabelAngsuran
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :loading="status === 'pending'"
          :total="total"
          :dropdown-items="getDropdownItems"
          @view="viewAngsuran"
        />
      </div>
    </UCard>
  </div>
</template>
