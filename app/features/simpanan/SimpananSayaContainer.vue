<script setup lang="ts">
import type { JenisPengajuan } from "./model";
import { openModal } from "~/composables/modal";
import { authClient, can } from "~/utils/auth";
import DaftarMutasiSimpanan from "./DaftarMutasiSimpanan.vue";
import ModalPengajuanSimpanan from "./ModalPengajuanSimpanan.vue";
import { pengajuanLabels } from "./model";
import RingkasanSaldo from "./RingkasanSaldo.vue";

const session = authClient.useSession();
const userId = computed(() => Number(session.value.data?.user.id));
const canManage = computed(() => can(session.value.data?.user.role, "simpananSaya", "manage"));
const saldo = useTemplateRef("saldo");
const mutasi = useTemplateRef("mutasi");

async function refreshSaldo() {
  await saldo.value?.refresh();
}

async function refreshAfterCreate() {
  await Promise.all([refreshSaldo(), mutasi.value?.refreshList()]);
}

function openForm(jenis: JenisPengajuan) {
  if (!canManage.value || !userId.value)
    return;
  openModal(ModalPengajuanSimpanan, {
    jenis,
    userId: userId.value,
    memberName: session.value.data?.user.name ?? "Saya",
    refresh: refreshAfterCreate,
  });
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Simpanan Saya
      </h1>
      <p class="mt-1 text-sm text-muted">
        Lihat saldo, kepemilikan saham, dan riwayat simpanan pribadi.
      </p>
    </div>
    <template v-if="userId">
      <RingkasanSaldo ref="saldo" :user-id="userId" />
      <div v-if="canManage" class="flex flex-wrap gap-3">
        <UButton v-for="jenis in (['tabungan', 'saham', 'penarikan'] as const)" :key="jenis" :icon="pengajuanLabels[jenis].icon" @click="openForm(jenis)">
          {{ pengajuanLabels[jenis].title }}
        </UButton>
      </div>
      <DaftarMutasiSimpanan ref="mutasi" scope="personal" :user-id="userId" @changed="refreshSaldo" />
    </template>
    <USkeleton v-else class="h-40 w-full" />
  </div>
</template>
