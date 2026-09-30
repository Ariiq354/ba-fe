<script setup lang="ts">
import DaftarMutasiSimpanan from "./DaftarMutasiSimpanan.vue";
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Approval Simpanan
      </h1>
      <p class="mt-1 text-sm text-muted">
        Tinjau pengajuan simpanan yang menunggu persetujuan, lalu setujui atau tolak.
      </p>
    </div>
    <DaftarMutasiSimpanan scope="approval" />
  </div>
</template>
