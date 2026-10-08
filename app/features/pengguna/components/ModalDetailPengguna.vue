<script setup lang="ts">
import type { Pengguna, VerifikasiPenggunaResponse } from "../model";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL, IMAGE_URL } from "~/constants";
import { authClient, can } from "~/utils/auth";
import { formatPenggunaDate, formatPenggunaRole, getPenggunaStatus, statusPenggunaLabels } from "../model";

const props = defineProps<{
  pengguna: Pengguna;
  refresh: () => Promise<void>;
}>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const isLoading = ref(false);
const canVerify = computed(() => can(session.value.data?.user.role, "pengguna", "manage") && getPenggunaStatus(props.pengguna) === "pending");
const imageSrc = computed(() => props.pengguna.image ? `${IMAGE_URL}/${props.pengguna.image}` : undefined);
const penggunaStatus = computed(() => statusPenggunaLabels[getPenggunaStatus(props.pengguna)]);

async function onVerify() {
  if (isLoading.value || !canVerify.value)
    return;
  isLoading.value = true;

  let result: VerifikasiPenggunaResponse;
  try {
    result = await $fetch<VerifikasiPenggunaResponse>(`/api/v1/pengguna/${props.pengguna.id}/verifikasi`, {
      baseURL: API_URL,
      method: "PATCH",
      credentials: "include",
    });
  }
  catch (error) {
    useToastError("Gagal Memverifikasi Pengguna", extractErrorMessage(error, "Pengguna gagal diverifikasi. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }

  useToastSuccess("Pengguna Berhasil Diverifikasi", `${props.pengguna.name} · Nomor anggota: ${result.noAnggota}`);
  emit("close");
  await props.refresh();
}
</script>

<template>
  <UModal
    :title="canVerify ? 'Verifikasi Pengguna' : 'Profil Pengguna'"
    :description="canVerify ? 'Periksa profil sebelum mengaktifkan akun.' : 'Informasi kontak dan keanggotaan pengguna.'"
    :ui="{ content: 'sm:max-w-xl rounded-2xl', header: 'pr-12 sm:pr-12', footer: 'bg-muted/30' }"
    :dismissible="!isLoading"
    :close="isLoading ? false : { onClick: () => emit('close') }"
  >
    <template #body>
      <div class="space-y-5">
        <div class="flex items-center gap-4">
          <div class="relative shrink-0">
            <UAvatar
              :src="imageSrc"
              :alt="pengguna.name"
              size="3xl"
              :ui="{ root: 'flex size-24 rounded-xl ring ring-default', image: 'rounded-xl object-cover' }"
            />
            <a
              v-if="imageSrc"
              :href="imageSrc"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`Lihat foto penuh ${pengguna.name}`"
              title="Lihat foto penuh"
              class="absolute inset-0 rounded-xl transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <span class="absolute right-1.5 bottom-1.5 flex size-6 items-center justify-center rounded-md bg-default/90 text-highlighted shadow-sm">
                <UIcon name="i-tabler-arrows-maximize" class="size-3.5" />
              </span>
            </a>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xl leading-tight font-semibold text-highlighted wrap-break-word">
              {{ pengguna.name }}
            </p>
            <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <span>{{ formatPenggunaRole(pengguna.role) }}</span>
              <template v-if="pengguna.username">
                <span aria-hidden="true">·</span>
                <span class="wrap-break-word">@{{ pengguna.username }}</span>
              </template>
            </div>
            <UBadge :color="penggunaStatus.color" variant="subtle" size="sm" class="mt-3">
              {{ penggunaStatus.label }}
            </UBadge>
          </div>
        </div>

        <div class="grid divide-y divide-default overflow-hidden rounded-xl border border-default sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <section class="min-w-0 space-y-4 p-4">
            <h3 class="text-xs font-semibold tracking-wide text-muted uppercase">
              Kontak
            </h3>
            <dl class="space-y-4 text-sm">
              <div class="space-y-1">
                <dt class="text-muted">
                  Nomor HP
                </dt>
                <dd class="font-medium text-highlighted wrap-break-word">
                  {{ pengguna.noHp || 'Belum tersedia' }}
                </dd>
              </div>
              <div class="space-y-1">
                <dt class="text-muted">
                  Nomor Anggota
                </dt>
                <dd v-if="pengguna.noAnggota" class="font-mono font-medium text-highlighted wrap-break-word">
                  {{ pengguna.noAnggota }}
                </dd>
                <dd v-else class="text-muted">
                  Belum diterbitkan
                </dd>
              </div>
            </dl>
          </section>
          <section class="min-w-0 space-y-4 p-4">
            <h3 class="text-xs font-semibold tracking-wide text-muted uppercase">
              Keanggotaan
            </h3>
            <dl class="space-y-4 text-sm">
              <div class="space-y-1">
                <dt class="text-muted">
                  Kelompok
                </dt>
                <dd class="font-medium text-highlighted wrap-break-word">
                  {{ pengguna.kodeKelompok }} · {{ pengguna.namaKelompok }}
                </dd>
              </div>
              <div class="space-y-1">
                <dt class="text-muted">
                  Tanggal Daftar
                </dt>
                <dd class="font-medium text-highlighted">
                  {{ formatPenggunaDate(pengguna.createdAt) }}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton color="neutral" variant="outline" size="md" class="justify-center" :disabled="isLoading" @click="emit('close')">
          {{ canVerify ? 'Batal' : 'Tutup' }}
        </UButton>
        <UButton v-if="canVerify" icon="i-tabler-user-check" size="md" class="justify-center" :loading="isLoading" @click="onVerify">
          Verifikasi Pengguna
        </UButton>
      </div>
    </template>
  </UModal>
</template>
