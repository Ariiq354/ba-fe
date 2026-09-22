import {
  adminClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";
import { API_URL } from "~/constants";

export const authClient = createAuthClient({
  baseURL: API_URL,

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
