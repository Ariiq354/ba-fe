<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { openModal } from "~/composables/modal";
import { extractErrorMessage, useToastError } from "~/composables/toast";
import { IMAGE_URL } from "~/constants";
import ModalChangePassword from "~/features/auth/components/ModalChangePassword.vue";
import ModalImpersonate from "~/features/auth/components/ModalImpersonate.vue";
import ModalChangeProfile from "~/features/pengguna/components/ModalChangeProfile.vue";
import { authClient } from "~/utils/auth";
import DashboardNavigationMenu from "./DashboardNavigationMenu.vue";

const session = authClient.useSession();
const isImpersonating = computed(() => !!session.value.data?.session.impersonatedBy);
const isReturning = ref(false);

async function stopImpersonating() {
  if (isReturning.value || !isImpersonating.value) return;
  isReturning.value = true;
  try {
    const { error } = await authClient.admin.stopImpersonating();
    if (error) throw new Error(error.message || "Gagal kembali ke akun semula.");
    await navigateTo("/dashboard", { external: true, replace: true });
  } catch (error) {
    useToastError("Gagal Kembali ke Akun Semula", extractErrorMessage(error, "Silakan coba lagi."));
    isReturning.value = false;
  }
}

async function signOut() {
  try {
    await authClient.signOut();

    await navigateTo("/");
  } catch {
    useToastError("Gagal Keluar", "Terjadi kesalahan saat keluar, silahkan coba lagi.");
  }
}

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: session.value.data?.user.name ?? "User",
      avatar: {
        src: session.value.data?.user.image
          ? `${IMAGE_URL}/${session.value.data.user.image}`
          : undefined,
        alt: session.value.data?.user.name ?? "User",
        loading: "lazy",
      },
      type: "label",
    },
  ],
  [
    {
      label: "Profil",
      icon: "i-tabler-user",
      disabled: isReturning.value,
      onSelect: () => openModal(ModalChangeProfile),
    },
    {
      label: "Ubah Password",
      icon: "i-tabler-lock-password",
      disabled: isReturning.value,
      onSelect: () => openModal(ModalChangePassword),
    },
    ...(isImpersonating.value
      ? [
          {
            label: "Kembali ke akun saya",
            icon: "i-tabler-arrow-back-up",
            disabled: isReturning.value,
            onSelect: stopImpersonating,
          },
        ]
      : session.value.data?.user.role === "admin"
        ? [
            {
              label: "Masuk sebagai pengguna",
              icon: "i-tabler-user-share",
              onSelect: () => openModal(ModalImpersonate),
            },
          ]
        : []),
  ],
  [
    {
      label: "Keluar",
      icon: "i-tabler-logout",
      color: "error",
      disabled: isReturning.value,
      onSelect: signOut,
    },
  ],
]);
</script>

<template>
  <UDashboardSidebar
    collapsible
    resizable
    class="bg-muted"
    :ui="{
      footer: 'border-t border-default',
      root: 'min-w-0 transition-all duration-300 overflow-hidden',
    }"
  >
    <template #header>
      <div class="flex h-14 w-full items-center gap-2 overflow-hidden px-3 py-2 text-left text-sm">
        <NuxtImg src="/logo.webp" alt="Berkah Amanah" class="size-8" />

        <div class="grid flex-1 text-left text-sm leading-tight">
          <span class="truncate font-medium">Berkah Amanah</span>
          <span class="truncate text-xs">Koperasi</span>
        </div>
      </div>
    </template>

    <DashboardNavigationMenu />

    <template #footer>
      <UDropdownMenu :items="items" :ui="{ content: 'w-(--reka-dropdown-menu-trigger-width)' }">
        <UButton
          :avatar="{
            src: session.data?.user.image ? `${IMAGE_URL}/${session.data.user.image}` : undefined,
            alt: session.data?.user.name ?? 'User',
            loading: 'lazy',
          }"
          :label="session.data?.user.name ?? 'User'"
          color="neutral"
          variant="ghost"
          class="w-full"
        />
      </UDropdownMenu>
    </template>
  </UDashboardSidebar>
</template>
