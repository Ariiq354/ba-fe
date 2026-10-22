<script setup lang="ts">
import DaftarMutasiSimpanan from "~/features/simpanan/components/DaftarMutasiSimpanan.vue";

definePageMeta({
  layout: { name: "default", props: { title: "Mutasi Simpanan" } },
});
useHead({ title: "Mutasi Simpanan · Berkah Amanah" });
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">Mutasi Simpanan</h1>
      <p class="mt-1 text-sm text-muted">
        Lihat riwayat simpanan anggota dalam cakupan akses Anda dan rincian penginputnya.
      </p>
    </div>
    <DaftarMutasiSimpanan scope="members" />
  </div>
</template>
