import { authClient } from "~/utils/auth";

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
  }
});
