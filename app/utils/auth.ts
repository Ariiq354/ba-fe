import {
  adminClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";

export function useAuthClient() {
  const config = useRuntimeConfig();

  return createAuthClient({
    baseURL: config.public.apiUrl,

    plugins: [
      usernameClient(),
      adminClient(),
      inferAdditionalFields({
        user: {
          idKelompok: {
            type: "number",
            required: true,
            input: true,
          },
        },
      }),
    ],
  });
}
