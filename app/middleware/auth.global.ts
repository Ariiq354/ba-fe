import { useAuthSession } from "~/composables/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const { session, error } = await useAuthSession();

  if (error.value && to.path.startsWith("/dashboard")) {
    throw createError({
      statusCode: 503,
      statusMessage: "Authentication service unavailable",
    });
  }

  if (to.path === "/") {
    if (session.value) {
      return navigateTo({ path: "/dashboard" });
    }
  };

  if (to.path.startsWith("/dashboard")) {
    if (!session.value) {
      return navigateTo({ path: "/" });
    }

    // const isAdminRoute = to.path.startsWith("/dashboard/admin");
    // if (isAdminRoute && session.value.user.role !== "admin") {
    //   return navigateTo({ path: "/dashboard" });
    // }
  }
});
