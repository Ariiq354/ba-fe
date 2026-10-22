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
      <h1 class="text-xl font-semibold text-highlighted">Mutasi simpanan</h1>
      <p class="mt-1 text-sm text-muted">Riwayat transaksi anggota dalam cakupan akses Anda.</p>
    </div>
    <DaftarMutasiSimpanan scope="members" />
  </div>
</template>
