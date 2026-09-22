import { useAuthClient } from "~/utils/auth";

export default defineNuxtRouteMiddleware(async (to) => {
  const authClient = useAuthClient();
  const { data: session } = await authClient.useSession(useFetch);

  if (to.path === "/") {
    if (session.value) {
      return navigateTo({ path: "/dashboard" });
    }
  };

  // if (to.path.startsWith("/dashboard")) {
  //   if (!session.value) {
  //     return navigateTo({ path: "/" });
  //   }

  //   const isAdminRoute = to.path.startsWith("/dashboard/admin");
  //   if (isAdminRoute && session.value.user.role !== "admin") {
  //     return navigateTo({ path: "/dashboard" });
  //   }
  // }
});
