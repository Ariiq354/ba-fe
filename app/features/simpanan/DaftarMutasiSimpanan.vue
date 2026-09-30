<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { AnggotaOptionsResponse, MutasiResponse, MutasiScope, MutasiSimpanan, StatusMutasi } from "./model";
import InputSearch from "~/components/input/InputSearch.vue";
import DataTable from "~/components/table/DataTable.vue";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { authClient, can } from "~/utils/auth";
import ModalDetailMutasi from "./ModalDetailMutasi.vue";
import ModalProsesMutasi from "./ModalProsesMutasi.vue";
import { canCancelMutasi, getAnggotaOptions, jenisSimpananOptions, jenisTransaksiOptions, mutasiColumns, statusMutasiLabels, statusMutasiOptions } from "./model";

const props = defineProps<{ scope: MutasiScope; userId?: number }>();
const emit = defineEmits<{ changed: [] }>();
const page = ref(1);
const search = ref("");
const statusFilter = ref<"all" | StatusMutasi>(props.scope === "approval" ? "pending" : "all");
const jenisSimpanan = ref<"all" | "tabungan" | "saham">("all");
const jenisTransaksi = ref<"all" | "setoran" | "penarikan">("all");
const selectedUserId = ref<number | "all">("all");
const limit = 10;
const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const canManage = computed(() => can(session.value.data?.user.role, props.scope === "personal" ? "simpananSaya" : "mutasiSimpanan", "manage"));
const canApprove = computed(() => can(session.value.data?.user.role, "approvalSimpanan", "manage"));

const { data: members, status: membersStatus, error: membersError, refresh: refreshMembers } = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", { immediate: props.scope !== "personal", watch: false });
const memberOptions = computed(() => [{ label: "Semua anggota", value: "all" }, ...getAnggotaOptions(members.value?.data ?? [])]);
const targetUserId = computed(() => props.scope === "personal" ? props.userId : selectedUserId.value === "all" ? undefined : selectedUserId.value);

watch([search, statusFilter, jenisSimpanan, jenisTransaksi, targetUserId], () => {
  page.value = 1;
}, { flush: "sync" });

const { data, status, error, refresh } = useApi<MutasiResponse>("/api/v1/simpanan/mutasi", {
  query: { page, limit, search, status: statusFilter, jenisSimpanan, jenisTransaksi, userId: targetUserId },
});
const total = computed(() => data.value?.total ?? 0);
const columns = computed(() => props.scope === "personal" ? mutasiColumns.filter(column => !("accessorKey" in column && column.accessorKey === "memberName")) : mutasiColumns);

async function refreshList() {
  await refresh();
  if (!error.value) {
    const lastPage = Math.max(1, Math.ceil(total.value / limit));
    if (page.value > lastPage) {
      page.value = lastPage;
      await nextTick();
      await refresh({ dedupe: "defer" });
    }
  }
}
defineExpose({ refreshList });

async function refreshAfterChange() {
  await refreshList();
  emit("changed");
}

function viewMutasi(mutasi: MutasiSimpanan) {
  openModal(ModalDetailMutasi, { mutasi });
}

function processMutasi(mutasi: MutasiSimpanan, action: "approve" | "reject" | "cancel") {
  if (status.value === "pending" || mutasi.statusApproved !== "pending")
    return;
  if (action === "cancel" ? !canManage.value || !canCancelMutasi(mutasi, actorId.value) : !canApprove.value)
    return;
  openModal(ModalProsesMutasi, { mutasi, action, refresh: refreshAfterChange });
}

function getDropdownItems(mutasi: MutasiSimpanan): DropdownMenuItem[] {
  if (mutasi.statusApproved !== "pending")
    return [];
  return [
    ...(props.scope === "approval" && canApprove.value
      ? [
          { label: "Setujui", icon: "i-tabler-check", onSelect: () => processMutasi(mutasi, "approve") },
          { label: "Tolak", icon: "i-tabler-x", color: "error" as const, onSelect: () => processMutasi(mutasi, "reject") },
        ]
      : []),
    ...(props.scope !== "approval" && canManage.value && canCancelMutasi(mutasi, actorId.value)
      ? [{ label: "Batalkan Pengajuan", icon: "i-tabler-ban", color: "warning" as const, onSelect: () => processMutasi(mutasi, "cancel") }]
      : []),
  ];
}
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <div class="flex flex-col gap-3 lg:flex-row">
        <InputSearch v-model="search" placeholder="Cari kode transaksi..." aria-label="Cari mutasi simpanan" />
        <USelectMenu v-if="scope !== 'personal'" v-model="selectedUserId" :items="memberOptions" value-key="value" :loading="membersStatus === 'pending'" :disabled="membersStatus !== 'success'" aria-label="Filter anggota" class="w-full lg:w-80" />
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <USelect v-if="scope !== 'approval'" v-model="statusFilter" :items="statusMutasiOptions" aria-label="Filter status transaksi" class="w-full" />
        <USelect v-model="jenisSimpanan" :items="jenisSimpananOptions" aria-label="Filter jenis simpanan" class="w-full" />
        <USelect v-model="jenisTransaksi" :items="jenisTransaksiOptions" aria-label="Filter jenis transaksi" class="w-full" />
      </div>
      <UAlert v-if="scope !== 'personal' && membersError" title="Gagal Memuat Pilihan Anggota" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]" />
      <UAlert v-if="error" title="Gagal Memuat Mutasi Simpanan" description="Data transaksi belum dapat dimuat. Silakan coba lagi." color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', variant: 'outline', onClick: refreshList }]" />
      <DataTable
        v-else
        v-model:page="page"
        :data="data?.data ?? []"
        :columns="columns"
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
              {{ scope === 'approval' ? 'Tidak ada pengajuan yang menunggu persetujuan' : 'Tidak ada mutasi simpanan' }}
            </p>
            <p class="mt-1 text-sm text-muted">
              Coba kata kunci atau filter lain untuk melihat transaksi.
            </p>
          </div>
        </template>
      </DataTable>
    </div>
  </UCard>
</template>
