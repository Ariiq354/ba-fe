import { authClient, can } from "~/utils/auth";

const routeResources = {
  "master-akun": "masterAkun",
  "master-margin": "masterMargin",
  "master-saham": "masterSaham",
  jurnal: "jurnal",
  users: "pengguna",
  simpanan: "simpananSaya",
  "daftar-simpanan": "mutasiSimpanan",
  pemindahbukuan: "pemindahbukuan",
  "daftar-pemindahbukuan": "approvalPemindahbukuan",
  pembiayaan: "pembiayaan",
  "daftar-pembiayaan": "approvalPembiayaan",
  angsuran: "angsuran",
  "daftar-angsuran": "approvalAngsuran",
} as const;

export default defineNuxtRouteMiddleware(async (to) => {
  const { data: session } = await authClient.getSession();

  if (to.path === "/") {
    if (session) {
      return navigateTo({ path: "/dashboard" });
    }
  }

  if (to.path.startsWith("/dashboard")) {
    if (!session) {
      return navigateTo({ path: "/" });
    }

    const adminPaths = [
      "/dashboard/pembiayaan-eksternal",
      "/dashboard/angsuran-eksternal",
      "/dashboard/jurnal",
      "/dashboard/neraca",
      "/dashboard/laba-rugi",
      "/dashboard/monitoring",
    ];
    if (
      session.user.role !== "admin" &&
      adminPaths.some((path) => to.path === path || to.path.startsWith(`${path}/`))
    ) {
      return navigateTo({ path: "/dashboard" });
    }

    for (const [route, resource] of Object.entries(routeResources)) {
      const path = `/dashboard/${route}`;
      if (
        (to.path === path || to.path.startsWith(`${path}/`)) &&
        !can(session.user.role, resource, "view")
      ) {
        return navigateTo({ path: "/dashboard" });
      }
    }
  }
});
