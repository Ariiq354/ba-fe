<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { PengajuanPemindahbukuan, TipePemindahbukuan } from "./model";
import type { AnggotaOptionsResponse, AnggotaSimpanan, HargaSaham, SaldoSimpanan } from "~/features/simpanan/model";
import { refDebounced } from "#imports";
import { useApi } from "~/composables/fetch";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { API_URL } from "~/constants";
import { getSaldoSimpananKey } from "~/features/simpanan/keys";
import { getAnggotaOptions } from "~/features/simpanan/model";
import { authClient, can } from "~/utils/auth";
import { formatRupiah } from "~/utils/format";
import { getPemindahbukuanLimit, getPemindahbukuanSchema, hargaNominalSaham, tipePemindahbukuanOptions } from "./model";
import { refreshPemindahbukuanData } from "./refresh";

const props = defineProps<{ refresh: () => Promise<void> }>();
const emit = defineEmits<{ close: [] }>();
const session = authClient.useSession();
const actorId = computed(() => Number(session.value.data?.user.id));
const canManage = computed(() => can(session.value.data?.user.role, "pemindahbukuan", "manage"));
const canDelegate = computed(() => can(session.value.data?.user.role, "inputSimpanan", "manage"));
const isLoading = ref(false);
const state = reactive({
  tipePemindahbukuan: "tabungan_ke_tabungan" as TipePemindahbukuan,
  idUserSumber: undefined as number | undefined,
  idUserTujuan: undefined as number | undefined,
  nominal: undefined as number | undefined,
  jumlahSaham: undefined as number | undefined,
  keterangan: "",
});
const conversion = computed(() => state.tipePemindahbukuan === "tabungan_ke_saham");
const shareTransfer = computed(() => state.tipePemindahbukuan === "saham_ke_saham");
const { data: sources, status: sourceStatus, error: sourceError, refresh: refreshSources } = useApi<AnggotaOptionsResponse>("/api/v1/pengguna/options", {
  enabled: canManage,
  watch: [canManage],
});
const sourceOptions = computed(() => getAnggotaOptions(sources.value?.data ?? []));
const sourceMember = computed(() => sources.value?.data.find(member => member.id === state.idUserSumber));
watch([sources, actorId], () => {
  if (state.idUserSumber === undefined && sources.value?.data.some(member => member.id === actorId.value && member.noAnggota?.trim()))
    state.idUserSumber = actorId.value;
}, { immediate: true });

const destinationSearch = ref("");
const debouncedDestinationSearch = refDebounced(destinationSearch, 300);
const destinationGroup = ref<number | "all">("all");
const destinationEnabled = computed(() => canManage.value && !conversion.value);
const { data: destinations, status: destinationStatus, error: destinationError, refresh: refreshDestinations } = useApi<AnggotaOptionsResponse>("/api/v1/pemindahbukuan/pengguna/options", {
  query: { search: debouncedDestinationSearch, idKelompok: computed(() => destinationGroup.value === "all" ? undefined : destinationGroup.value) },
  enabled: destinationEnabled,
  watch: [destinationEnabled],
});
const selectedDestination = ref<AnggotaSimpanan>();
watch(() => state.idUserTujuan, (id) => {
  selectedDestination.value = destinations.value?.data.find(member => member.id === id)
    ?? (selectedDestination.value?.id === id ? selectedDestination.value : undefined);
}, { flush: "sync" });
const destinationMember = computed(() => conversion.value ? sourceMember.value : selectedDestination.value);
watch(destinationGroup, () => {
  state.idUserTujuan = undefined;
  destinationSearch.value = "";
});
const destinationOptions = computed(() => {
  const members = new Map((destinations.value?.data ?? []).map(member => [member.id, member]));
  if (selectedDestination.value)
    members.set(selectedDestination.value.id, selectedDestination.value);
  return getAnggotaOptions([...members.values()].filter(member => member.id !== state.idUserSumber));
});
const { data: groups, status: groupStatus, error: groupError, refresh: refreshGroups } = useApi<{ data: { id: number; namaKelompok: string }[] }>("/api/v1/kelompok/options");
const groupOptions = computed(() => [{ label: "Semua kelompok", value: "all" }, ...(groups.value?.data.map(group => ({ label: group.namaKelompok, value: group.id })) ?? [])]);

watch(() => state.tipePemindahbukuan, () => {
  state.nominal = undefined;
  state.jumlahSaham = undefined;
  state.idUserTujuan = conversion.value ? state.idUserSumber : undefined;
});
watch(() => state.idUserSumber, (id) => {
  if (conversion.value)
    state.idUserTujuan = id;
  else if (state.idUserTujuan === id)
    state.idUserTujuan = undefined;
});

const balanceEnabled = computed(() => canManage.value && !!sourceMember.value?.noAnggota?.trim());
const { data: balance, status: balanceStatus, error: balanceError, refresh: refreshBalance } = useApi<SaldoSimpanan>("/api/v1/simpanan/saldo", {
  key: computed(() => getSaldoSimpananKey(state.idUserSumber ?? 0)),
  query: { userId: computed(() => state.idUserSumber) },
  enabled: balanceEnabled,
  watch: [balanceEnabled],
});
const priceEnabled = computed(() => canManage.value && conversion.value);
const { data: price, status: priceStatus, error: priceError, refresh: refreshPrice } = useApi<HargaSaham>("/api/v1/master-saham/latest", {
  enabled: priceEnabled,
  watch: [priceEnabled],
});
const schema = computed(() => getPemindahbukuanSchema(balance.value, price.value));
const maxAmount = computed(() => getPemindahbukuanLimit(state.tipePemindahbukuan, balance.value, price.value));
const estimatedAmount = computed(() => state.tipePemindahbukuan === "tabungan_ke_tabungan" ? state.nominal ?? 0 : (state.jumlahSaham ?? 0) * (conversion.value ? price.value?.hargaJual ?? 0 : hargaNominalSaham));
const availableAfter = computed(() => shareTransfer.value
  ? Math.max(0, (balance.value?.jumlahSahamEfektif ?? 0) - (state.jumlahSaham ?? 0))
  : Math.max(0, (balance.value?.saldoEfektif ?? 0) - estimatedAmount.value));
const ready = computed(() => canManage.value && sourceStatus.value === "success" && !!sourceMember.value?.noAnggota?.trim()
  && !!destinationMember.value?.noAnggota?.trim() && balanceStatus.value === "success" && maxAmount.value > 0
  && (!conversion.value || priceStatus.value === "success"));

async function onSubmit(event: FormSubmitEvent<PengajuanPemindahbukuan>) {
  if (isLoading.value || !ready.value)
    return;
  isLoading.value = true;
  try {
    await $fetch("/api/v1/pemindahbukuan", {
      baseURL: API_URL,
      method: "POST",
      credentials: "include",
      body: event.data,
    });
  }
  catch (error) {
    useToastError("Gagal Mengajukan Pemindahbukuan", extractErrorMessage(error, "Pengajuan gagal disimpan. Silakan coba lagi."));
    isLoading.value = false;
    return;
  }
  useToastSuccess("Pemindahbukuan Berhasil Diajukan", "Pengajuan menunggu persetujuan admin.");
  emit("close");
  await refreshPemindahbukuanData([event.data.idUserSumber, event.data.idUserTujuan], props.refresh);
}
</script>

<template>
  <UModal title="Ajukan Pemindahbukuan" description="Pindahkan simpanan berdasarkan saldo atau saham yang tersedia." :ui="{ content: 'sm:max-w-4xl' }" :dismissible="!isLoading" :close="isLoading ? false : { onClick: () => emit('close') }">
    <template #body>
      <UForm id="form-pemindahbukuan" :schema="schema" :state="state" :disabled="isLoading" class="space-y-5" @submit="onSubmit">
        <UFormField label="Jenis Pemindahbukuan" name="tipePemindahbukuan" required>
          <USelect v-model="state.tipePemindahbukuan" :items="tipePemindahbukuanOptions" class="w-full" />
        </UFormField>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-3 rounded-lg border border-default p-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="font-medium text-highlighted">
                Sumber
              </h3>
              <UButton v-if="balanceEnabled" icon="i-tabler-refresh" color="neutral" variant="ghost" size="xs" :loading="balanceStatus === 'pending'" :disabled="isLoading" aria-label="Muat ulang saldo sumber" @click="() => refreshBalance()" />
            </div>
            <UFormField label="Anggota Sumber" name="idUserSumber" required>
              <USelectMenu v-model="state.idUserSumber" :items="sourceOptions" value-key="value" placeholder="Pilih anggota sumber" :loading="sourceStatus === 'pending'" :disabled="!canDelegate || sourceStatus !== 'success' || isLoading" class="w-full" />
            </UFormField>
            <UAlert v-if="sourceError" title="Gagal Memuat Anggota Sumber" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshSources() }]" />
            <UAlert v-else-if="sourceStatus === 'success' && !sourceOptions.some(option => !option.disabled)" title="Anggota Sumber Belum Tersedia" description="Sumber pemindahbukuan harus memiliki nomor anggota." color="info" variant="subtle" />
            <UAlert v-if="balanceError" title="Gagal Memuat Saldo Sumber" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshBalance() }]" />
            <template v-else-if="sourceMember">
              <p class="text-sm text-muted">
                {{ shareTransfer ? 'Saham tersedia' : 'Saldo tabungan tersedia' }}
              </p>
              <USkeleton v-if="balanceStatus === 'pending'" class="h-6 w-32" />
              <p v-else class="text-lg font-semibold">
                {{ balance ? shareTransfer ? `${balance.jumlahSahamEfektif.toLocaleString('id-ID')} lembar` : formatRupiah(balance.saldoEfektif) : '—' }}
              </p>
              <p v-if="balance" class="text-xs text-muted">
                {{ shareTransfer ? `${balance.totalSahamPending.toLocaleString('id-ID')} lembar dicadangkan` : `${formatRupiah(balance.totalPenarikanPending + balance.totalPemindahbukuanPending)} dicadangkan` }}
              </p>
            </template>
          </div>
          <div class="space-y-3 rounded-lg border border-default p-4">
            <h3 class="font-medium text-highlighted">
              Tujuan
            </h3>
            <UFormField v-if="conversion" label="Anggota Tujuan" name="idUserTujuan" description="Konversi tabungan ke saham dilakukan untuk anggota yang sama." required>
              <UInput :model-value="sourceMember ? `${sourceMember.name} · ${sourceMember.noAnggota}` : ''" placeholder="Pilih anggota sumber terlebih dahulu" readonly class="w-full" />
            </UFormField>
            <template v-else>
              <UFormField label="Kelompok Tujuan">
                <USelect v-model="destinationGroup" :items="groupOptions" :loading="groupStatus === 'pending'" :disabled="groupStatus !== 'success' || isLoading" class="w-full" />
              </UFormField>
              <UAlert v-if="groupError" title="Gagal Memuat Kelompok" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshGroups() }]" />
              <UFormField label="Anggota Tujuan" name="idUserTujuan" description="Cari nama atau nomor anggota; tujuan dapat berasal dari kelompok lain." required>
                <USelectMenu v-model="state.idUserTujuan" v-model:search-term="destinationSearch" :items="destinationOptions" value-key="value" placeholder="Pilih anggota tujuan" :search-input="{ placeholder: 'Cari nama atau nomor anggota...' }" :loading="destinationStatus === 'pending'" :disabled="isLoading" ignore-filter class="w-full" />
              </UFormField>
              <UAlert v-if="destinationError" title="Gagal Memuat Anggota Tujuan" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshDestinations() }]" />
            </template>
            <p class="text-sm text-muted">
              {{ state.tipePemindahbukuan === 'tabungan_ke_tabungan' ? 'Menerima tabungan' : 'Menerima saham' }}
            </p>
          </div>
        </div>
        <UFormField v-if="state.tipePemindahbukuan === 'tabungan_ke_tabungan'" label="Nominal (Rp)" name="nominal" required>
          <UInputNumber v-model="state.nominal" :min="1" :max="Math.max(1, maxAmount)" :step="1" class="w-full" />
        </UFormField>
        <UFormField v-else label="Jumlah Saham (Lembar)" name="jumlahSaham" required>
          <UInputNumber v-model="state.jumlahSaham" :min="1" :max="Math.max(1, maxAmount)" :step="1" class="w-full" />
        </UFormField>
        <UAlert v-if="conversion && priceError" title="Harga Saham Belum Tersedia" color="error" variant="subtle" :actions="[{ label: 'Coba lagi', color: 'error', onClick: () => refreshPrice() }]" />
        <p v-else-if="conversion" class="text-sm text-muted">
          Harga jual per lembar: {{ priceStatus === 'pending' ? 'Memuat...' : price ? formatRupiah(price.hargaJual) : '—' }}. Harga final ditetapkan saat pengajuan dan digunakan saat approval.
        </p>
        <UAlert v-if="balanceStatus === 'success' && maxAmount === 0 && (!conversion || priceStatus === 'success')" title="Saldo atau Saham Tidak Mencukupi" description="Tidak ada saldo atau saham tersedia untuk pengajuan ini." color="info" variant="subtle" />
        <UFormField label="Keterangan" name="keterangan">
          <UTextarea v-model="state.keterangan" placeholder="Keterangan pemindahbukuan (opsional)" class="w-full" />
        </UFormField>
        <div v-if="sourceMember && destinationMember && balanceStatus === 'success'" class="space-y-2 rounded-lg bg-elevated p-4" aria-live="polite">
          <p class="font-medium">
            {{ sourceMember.name }} → {{ destinationMember.name }}
          </p>
          <p v-if="state.tipePemindahbukuan !== 'tabungan_ke_tabungan'">
            {{ (state.jumlahSaham ?? 0).toLocaleString('id-ID') }} lembar saham {{ conversion ? 'diperoleh' : 'dipindahkan' }}
          </p>
          <p>{{ shareTransfer ? 'Nilai referensi saham' : conversion ? 'Estimasi tabungan digunakan' : 'Tabungan dipindahkan' }}: <strong>{{ conversion && priceStatus !== 'success' ? '—' : formatRupiah(estimatedAmount) }}</strong></p>
          <p v-if="!conversion || priceStatus === 'success'" class="text-sm text-muted">
            {{ shareTransfer ? 'Saham tersedia' : 'Saldo tersedia' }} sumber setelah diajukan: {{ shareTransfer ? `${availableAfter.toLocaleString('id-ID')} lembar` : formatRupiah(availableAfter) }}.
          </p>
        </div>
        <p class="text-sm text-muted">
          Pengajuan menunggu persetujuan admin. Saldo atau saham sumber dicadangkan selama pending dan dilepas jika pengajuan ditolak atau dibatalkan.
        </p>
      </UForm>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="ghost" :disabled="isLoading" @click="emit('close')">
          Batal
        </UButton>
        <UButton type="submit" form="form-pemindahbukuan" icon="i-tabler-send" :loading="isLoading" :disabled="!ready">
          Ajukan
        </UButton>
      </div>
    </template>
  </UModal>
</template>
