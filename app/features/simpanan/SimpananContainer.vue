<script setup lang="ts">
import type { AnggotaOptionsResponse, JenisPengajuan } from "./model";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { authClient, can } from "~/utils/auth";
import DaftarMutasiSimpanan from "./components/DaftarMutasiSimpanan.vue";
import ModalPembelianSaham from "./components/ModalPembelianSaham.vue";
import ModalPenarikanTabungan from "./components/ModalPenarikanTabungan.vue";
import ModalSetoranTabungan from "./components/ModalSetoranTabungan.vue";
import RingkasanSaldo from "./components/RingkasanSaldo.vue";
import { getAnggotaOptions, pengajuanLabels } from "./model";

const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const canSelectMember = computed(() => can(session.value.data?.user.role, "inputSimpanan", "view"));
const selection = ref<number>();
const {
  data: members,
  status: membersStatus,
  error: membersError,
  refresh: refreshMembers,
} = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canSelectMember,
  watch: [canSelectMember],
});
const memberOptions = computed(() => [
  { label: `${session.value.data?.user.name ?? "Saya"} (Saya)`, value: actorId.value },
  ...(canSelectMember.value
    ? getAnggotaOptions(members.value?.data ?? []).filter(
        (member) => member.value !== actorId.value,
      )
    : []),
]);
const userId = computed({
  get: () => (canSelectMember.value ? (selection.value ?? actorId.value) : actorId.value),
  set: (value: number) => {
    if (
      canSelectMember.value &&
      memberOptions.value.some(
        (member) => member.value === value && !("disabled" in member && member.disabled),
      )
    ) {
      selection.value = value;
    }
  },
});
const selectedMember = computed(() =>
  members.value?.data.find((member) => member.id === userId.value),
);
const memberName = computed(() =>
  userId.value === actorId.value
    ? (session.value.data?.user.name ?? "Saya")
    : (selectedMember.value?.name ?? ""),
);
const canManage = computed(() => {
  const role = session.value.data?.user.role;
  return userId.value === actorId.value
    ? can(role, "simpananSaya", "manage") || can(role, "inputSimpanan", "manage")
    : canSelectMember.value &&
        can(role, "inputSimpanan", "manage") &&
        !!selectedMember.value?.noAnggota?.trim();
});

watch([actorId, canSelectMember], () => {
  selection.value = undefined;
});
const saldo = useTemplateRef("saldo");
const mutasi = useTemplateRef("mutasi");

async function refreshSaldo() {
  await saldo.value?.refresh();
}

async function refreshAfterCreate() {
  await Promise.all([refreshSaldo(), mutasi.value?.refreshList()]);
}

const pengajuanModals = {
  tabungan: ModalSetoranTabungan,
  saham: ModalPembelianSaham,
  penarikan: ModalPenarikanTabungan,
};

function openForm(jenis: JenisPengajuan) {
  if (!canManage.value || !userId.value) return;
  openModal(pengajuanModals[jenis], {
    userId: userId.value,
    memberName: memberName.value,
    refresh: refreshAfterCreate,
  });
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">Simpanan</h1>
      <p class="mt-1 text-sm text-muted">
        Lihat saldo, kepemilikan saham, dan riwayat simpanan, serta ajukan transaksi untuk anggota
        terpilih.
      </p>
    </div>
    <UCard v-if="canSelectMember">
      <div class="space-y-4">
        <UFormField
          label="Anggota"
          description="Pilih anggota dalam cakupan akses Anda. Default adalah akun Anda sendiri."
        >
          <USelectMenu
            v-model="userId"
            :items="memberOptions"
            value-key="value"
            placeholder="Cari nama atau nomor anggota..."
            :loading="membersStatus === 'pending'"
            :disabled="membersStatus !== 'success'"
            aria-label="Pilih anggota simpanan"
            class="w-full"
          />
        </UFormField>
        <UAlert
          v-if="membersError"
          title="Gagal Memuat Pilihan Anggota"
          description="Simpanan Anda tetap dapat dilihat. Coba lagi untuk memilih anggota lain."
          color="error"
          variant="subtle"
          :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshMembers() }]"
        />
      </div>
    </UCard>
    <div v-if="userId" :key="userId" class="space-y-6">
      <RingkasanSaldo ref="saldo" :user-id="userId" />
      <div v-if="canManage" class="flex flex-wrap justify-end gap-3">
        <UButton
          v-for="jenis in ['tabungan', 'saham', 'penarikan'] as const"
          :key="jenis"
          :icon="pengajuanLabels[jenis].icon"
          @click="openForm(jenis)"
        >
          {{ pengajuanLabels[jenis].title }}
        </UButton>
      </div>
      <DaftarMutasiSimpanan ref="mutasi" scope="member" :user-id="userId" @changed="refreshSaldo" />
    </div>
    <USkeleton v-else class="h-40 w-full" />
  </div>
</template>
