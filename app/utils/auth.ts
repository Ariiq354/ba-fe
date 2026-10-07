import type { statement } from "~/utils/permissions";
import {
  adminClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/vue";
import { API_URL } from "~/constants";
import { ac, roles } from "~/utils/permissions";

export const authClient = createAuthClient({
  baseURL: API_URL,
  fetchOptions: {
    credentials: "include",
  },
  plugins: [
    usernameClient(),
    adminClient({ ac, roles }),
    inferAdditionalFields({
      user: {
        noHp: {
          type: "string",
          required: true,
          input: true,
        },
        idKelompok: {
          type: "number",
          required: true,
          input: true,
        },
      },
    }),
  ],
});

type Resource = keyof typeof statement;
type Action<R extends Resource> = (typeof statement)[R][number];

function isRegisteredRole(role: string): role is keyof typeof roles {
  return Object.hasOwn(roles, role);
}

export function can<R extends Resource>(
  role: string | null | undefined,
  resource: R,
  action: Action<R>,
) {
  return (role?.split(",") ?? []).some((value) => {
    const roleName = value.trim();
    if (!isRegisteredRole(roleName)) {
      return false;
    }

    return authClient.admin.checkRolePermission({
      role: roleName,
      permissions: { [resource]: [action] } as any,
    });
  });
}
