import {
  adminClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient({
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
