import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  masterAkun: ["view", "manage"],
  masterMargin: ["view", "manage"],
  masterSaham: ["view", "manage"],
  jurnal: ["view", "manage"],
  pengguna: ["view", "manage"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
});

export const pj = ac.newRole({
});

export const admin = ac.newRole({
  ...adminAc.statements,
  masterAkun: ["view", "manage"],
  masterMargin: ["view", "manage"],
  masterSaham: ["view", "manage"],
  jurnal: ["view", "manage"],
  pengguna: ["view", "manage"],
});

export const roles = { user, admin, pj };
