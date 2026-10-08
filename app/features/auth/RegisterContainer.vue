<script setup lang='ts'>
import type { FormSubmitEvent } from "@nuxt/ui";
import type { RegisterSchema } from "./model";
import InputPassword from "~/components/input/InputPassword.vue";
import SelectKelompok from "~/components/select/SelectKelompok.vue";
import { extractErrorMessage, useToastError, useToastSuccess } from "~/composables/toast";
import { useUploadFile } from "~/composables/upload";
import { authClient } from "~/utils/auth";
import { initRegisterFormdata, registerSchema } from "./model";

const state = reactive({ ...initRegisterFormdata });

const isLoading = ref(false);
async function onSubmit(event: FormSubmitEvent<RegisterSchema>) {
  isLoading.value = true;
  try {
    const image = await useUploadFile(event.data.image, "avatar");

    const { error } = await authClient.signUp.email({
      name: event.data.name,
      email: `${event.data.username}@auth.local`,
      username: event.data.username,
      password: event.data.password,
      idKelompok: event.data.idKelompok,
      noHp: event.data.noHp,
      image,
    });

    if (error) {
      const message = error.code === "USERNAME_IS_ALREADY_TAKEN"
        ? "Username sudah digunakan. Silakan gunakan username lain."
        : error.message || "Terjadi kesalahan. Silakan coba lagi beberapa saat lagi.";
      useToastError("Registrasi Gagal", message);
      return;
    }

    useToastSuccess("Registrasi Berhasil", "Akun Anda telah berhasil dibuat. Silakan login untuk melanjutkan.");
    await navigateTo("/");
  }
  catch (err: unknown) {
    useToastError("Registrasi Gagal", extractErrorMessage(err, "Gagal mengunggah foto atau membuat akun. Silakan coba lagi."));
  }
  finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0 grid md:grid-cols-2 max-w-sm md:max-w-6xl' }">
    <div class="flex flex-col items-center justify-center p-4 md:p-8 space-y-8">
      <div class="text-center">
        <NuxtImg
          src="/logo.webp"
          class="mx-auto h-24 w-24"
        />

        <h1 class="mt-4 text-2xl font-bold">
          Buat Akun Baru
        </h1>

        <p class="text-sm text-muted">
          Lengkapi data berikut untuk membuat akun baru.
        </p>
      </div>
      <UForm
        :schema="registerSchema"
        :state="state"
        class="w-full space-y-6"
        @submit="onSubmit"
      >
        <UFormField label="Foto Profil" name="image" required>
          <UFileUpload
            :model-value="state.image"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            highlight
            color="neutral"
            icon="i-tabler-photo"
            label="Pilih foto profil"
            size="sm"
            class="aspect-square w-32"
            :ui="{ base: 'p-2', wrapper: 'p-2' }"
            :disabled="isLoading"
            @update:model-value="state.image = $event ?? undefined"
          />
        </UFormField>

        <UFormField label="Nama Lengkap" name="name" required>
          <UInput
            v-model="state.name"
            :disabled="isLoading"
            placeholder="Masukkan nama lengkap anda"
          />
        </UFormField>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UFormField class="min-w-0" label="Nomor HP" name="noHp" required>
            <UInput
              v-model="state.noHp"
              class="w-full"
              type="tel"
              autocomplete="tel"
              :disabled="isLoading"
              placeholder="08xxxxxxxxxx"
            />
          </UFormField>

          <UFormField class="min-w-0" label="Username" name="username" required>
            <UInput
              v-model="state.username"
              class="w-full"
              :disabled="isLoading"
              placeholder="Masukkan username anda"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <UFormField class="min-w-0" label="Password" name="password" required>
            <InputPassword
              v-model="state.password"
              class="w-full"
              :disabled="isLoading"
              placeholder="Masukkan password anda"
            />
          </UFormField>

          <UFormField class="min-w-0" label="Konfirmasi Password" name="confirmPassword" required>
            <InputPassword
              v-model="state.confirmPassword"
              class="w-full"
              :disabled="isLoading"
              placeholder="Masukkan konfirmasi password"
            />
          </UFormField>
        </div>

        <UFormField label="Pilih Kelompok" name="idKelompok" required>
          <SelectKelompok
            v-model="state.idKelompok"
            :disabled="isLoading"
          />
        </UFormField>

        <UButton
          class="flex w-full justify-center"
          type="submit"
          :loading="isLoading"
        >
          Daftar
        </UButton>
        <p class="text-center text-sm text-muted">
          Sudah punya akun?
          <NuxtLink
            to="/"
            class="font-medium text-primary hover:underline"
          >
            Masuk sekarang
          </NuxtLink>
        </p>
      </UForm>
    </div>

    <div class="bg-muted relative hidden md:block">
      <NuxtImg
        src="/vertical.webp"
        alt="Image Vertical"
        class="h-full w-full object-cover"
      />
    </div>
  </UCard>
</template>
