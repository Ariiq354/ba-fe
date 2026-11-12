<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Pembiayaan, PembiayaanResponse } from "./model";
import type { StatusMutasi } from "~/features/simpanan/model";
import InputSearch from "~/components/input/InputSearch.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { usePaginatedRefresh } from "~/composables/pagination";
import { PAGE_SIZE } from "~/constants";
import { statusMutasiOptions } from "~/features/simpanan/model";
import { authClient } from "~/utils/auth";
import ModalDetailPembiayaan from "./components/ModalDetailPembiayaan.vue";
import ModalPengajuanPembiayaan from "./components/ModalPengajuanPembiayaan.vue";
import ModalProsesPembiayaan from "./components/ModalProsesPembiayaan.vue";
import TabelPembiayaan from "./components/TabelPembiayaan.vue";
import { PEMBIAYAAN_LIST_KEY, refreshPembiayaanData } from "./data";
import { canCancelPembiayaan } from "./model";

const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const page = ref(1);
const search = ref("");
const statusFilter = ref<"all" | StatusMutasi>("all");
const limit = PAGE_SIZE;
watch(
  [search, statusFilter],
  () => {
    page.value = 1;
  },
  { flush: "sync" },
);

const { data, status, error, refresh } = useApi<PembiayaanResponse>("/api/v1/pembiayaan", {
  key: PEMBIAYAAN_LIST_KEY,
  query: { page, limit, search, status: statusFilter },
});
const total = computed(() => data.value?.total ?? 0);
const refreshList = usePaginatedRefresh({ page, total, error, limit, refresh });

function refreshAfterChange() {
  return refreshPembiayaanData(refreshList);
}

function openForm() {
  openModal(ModalPengajuanPembiayaan, { refresh: refreshAfterChange });
}
function viewPembiayaan(item: Pembiayaan) {
  openModal(ModalDetailPembiayaan, { pembiayaan: item });
}
function cancelPembiayaan(item: Pembiayaan) {
  if (status.value === "pending" || item.statusApproved !== "pending") return;
  if (!canCancelPembiayaan(item, actorId.value)) return;
  openModal(ModalProsesPembiayaan, {
    pembiayaan: item,
    action: "cancel",
    refresh: refreshAfterChange,
  });
}
function getDropdownItems(item: Pembiayaan): DropdownMenuItem[] {
  if (item.statusApproved !== "pending" || status.value === "pending") return [];
  if (canCancelPembiayaan(item, actorId.value))
    return [
      {
        label: "Batalkan Pengajuan",
        icon: "i-tabler-ban",
        color: "warning",
        onSelect: () => cancelPembiayaan(item),
      },
    ];
  return [];
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">Pembiayaan</h1>
        <p class="mt-1 text-sm text-muted">
          Ajukan pembiayaan dan pantau status pengajuan anggota dalam cakupan akses Anda.
        </p>
      </div>
      <UButton icon="i-tabler-plus" class="justify-center" @click="openForm"
        >Ajukan Pembiayaan</UButton
      >
    </div>
    <UCard>
      <div class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row">
          <InputSearch
            v-model="search"
            placeholder="Cari kode transaksi..."
            aria-label="Cari pembiayaan"
          />
          <USelect
            v-model="statusFilter"
            :items="statusMutasiOptions"
            aria-label="Filter status pembiayaan"
            class="w-full lg:w-48"
          />
        </div>
        <UAlert
          v-if="error"
          title="Gagal Memuat Pembiayaan"
          description="Data belum dapat dimuat. Silakan coba lagi."
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: refreshList }]"
        />
        <TabelPembiayaan
          v-else
          v-model:page="page"
          :data="data?.data ?? []"
          :loading="status === 'pending'"
          :total="total"
          :dropdown-items="getDropdownItems"
          @view="viewPembiayaan"
        />
      </div>
    </UCard>
  </div>
</template>
