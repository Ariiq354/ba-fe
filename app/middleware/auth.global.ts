import { authClient, can } from "~/utils/auth";

const routeResources = {
  "master-akun": "masterAkun",
  "master-margin": "masterMargin",
  "master-saham": "masterSaham",
  "jurnal": "jurnal",
  "users": "pengguna",
  "simpanan": "simpananSaya",
  "input-simpanan": "inputSimpanan",
  "mutasi-simpanan": "mutasiSimpanan",
  "approval-simpanan": "approvalSimpanan",
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

    for (const [route, resource] of Object.entries(routeResources)) {
      const path = `/dashboard/${route}`;
      if (
        (to.path === path || to.path.startsWith(`${path}/`))
        && !can(session.user.role, resource, "view")
      ) {
        return navigateTo({ path: "/dashboard" });
      }
    }
  }
});
