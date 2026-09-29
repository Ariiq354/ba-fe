import { authClient, can } from "~/utils/auth";

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

    if (
      (to.path === "/dashboard/master-akun" || to.path.startsWith("/dashboard/master-akun/"))
      && !can(session.user.role, "masterAkun", "view")
    ) {
      return navigateTo({ path: "/dashboard" });
    }
  }
});
