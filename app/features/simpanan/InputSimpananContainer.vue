<script setup lang="ts">
import type { AnggotaOptionsResponse, JenisPengajuan } from "./model";
import { useApi } from "~/composables/fetch";
import { openModal } from "~/composables/modal";
import { authClient, can } from "~/utils/auth";
import ModalPengajuanSimpanan from "./components/ModalPengajuanSimpanan.vue";
import RingkasanSaldo from "./components/RingkasanSaldo.vue";
import { getAnggotaOptions, pengajuanLabels } from "./model";

const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "inputSimpanan", "manage"));
const selectedUserId = ref<number>();
const saldo = useTemplateRef("saldo");
const { data, status, error, refresh } = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options");
const options = computed(() => getAnggotaOptions(data.value?.data ?? []));
const selectedMember = computed(() =>
  data.value?.data.find((member) => member.id === selectedUserId.value),
);

async function refreshSaldo() {
  await saldo.value?.refresh();
}

function openForm(jenis: JenisPengajuan) {
  if (!canManage.value || !selectedMember.value?.noAnggota?.trim()) return;
  openModal(ModalPengajuanSimpanan, {
    jenis,
    userId: selectedMember.value.id,
    memberName: selectedMember.value.name,
    refresh: refreshSaldo,
  });
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-xl font-semibold text-highlighted">Input simpanan anggota</h1>
      <p class="mt-1 text-sm text-muted">Pilih anggota, lalu buat pengajuan transaksi.</p>
    </div>
    <UCard>
      <UAlert
        v-if="error"
        title="Gagal Memuat Anggota"
        description="Pilihan anggota belum dapat dimuat. Silakan coba lagi."
        color="error"
        variant="subtle"
        :actions="[
          { label: 'Coba lagi', color: 'error', variant: 'outline', onClick: () => refresh() },
        ]"
      />
      <UFormField
        v-else
        label="Anggota"
        description="Pengguna yang belum memiliki nomor anggota belum dapat dipilih."
      >
        <USelectMenu
          v-model="selectedUserId"
          :items="options"
          value-key="value"
          placeholder="Cari nama atau nomor anggota..."
          :loading="status === 'pending'"
          :disabled="status !== 'success'"
          class="w-full"
        />
      </UFormField>
    </UCard>
    <template v-if="selectedMember">
      <div class="flex flex-col gap-1">
        <h2 class="text-lg font-semibold">
          {{ selectedMember.name }}
        </h2>
        <p class="text-sm text-muted">
          {{ selectedMember.noAnggota }} · {{ selectedMember.namaKelompok }}
        </p>
      </div>
      <RingkasanSaldo :key="selectedMember.id" ref="saldo" :user-id="selectedMember.id" />
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-for="jenis in ['tabungan', 'saham', 'penarikan'] as const"
          :key="jenis"
          :icon="pengajuanLabels[jenis].icon"
          color="neutral"
          variant="outline"
          :disabled="!canManage"
          @click="openForm(jenis)"
        >
          {{ pengajuanLabels[jenis].title }}
        </UButton>
      </div>
    </template>
    <div v-else-if="status === 'success'" class="py-8 text-center">
      <p class="font-medium">Belum ada anggota dipilih</p>
      <p class="mt-1 text-sm text-muted">
        Saldo dan pilihan transaksi akan tampil setelah anggota dipilih.
      </p>
    </div>
  </div>
</template>
