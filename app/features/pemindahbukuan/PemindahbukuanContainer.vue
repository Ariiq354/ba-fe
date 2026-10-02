<script setup lang="ts">
import { openModal } from "~/composables/modal";
import { authClient, can } from "~/utils/auth";
import DaftarPemindahbukuan from "./DaftarPemindahbukuan.vue";
import ModalPengajuanPemindahbukuan from "./ModalPengajuanPemindahbukuan.vue";

const session = authClient.useSession();
const canManage = computed(() => can(session.value.data?.user.role, "pemindahbukuan", "manage"));
const daftar = useTemplateRef("daftar");

async function refreshList() {
  await daftar.value?.refreshList();
}

function openForm() {
  if (canManage.value)
    openModal(ModalPengajuanPemindahbukuan, { refresh: refreshList });
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
    <DaftarPemindahbukuan ref="daftar" scope="history" />
  </div>
</template>
