import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

export const statement = {
  ...defaultStatements,
  masterAkun: ["view", "manage"],
  masterMargin: ["view", "manage"],
  masterSaham: ["view", "manage"],
  jurnal: ["view", "manage"],
  pengguna: ["view", "manage"],
  simpananSaya: ["view", "manage"],
  inputSimpanan: ["view", "manage"],
  mutasiSimpanan: ["view", "manage"],
  approvalSimpanan: ["view", "manage"],
  pemindahbukuan: ["view", "manage"],
  approvalPemindahbukuan: ["view", "manage"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
  simpananSaya: ["view", "manage"],
  pemindahbukuan: ["view", "manage"],
});

export const pj = ac.newRole({
  simpananSaya: ["view", "manage"],
  inputSimpanan: ["view", "manage"],
  mutasiSimpanan: ["view", "manage"],
  pemindahbukuan: ["view", "manage"],
});

export const admin = ac.newRole(statement);

export const wanhat = ac.newRole({});

export const roles = { user, admin, pj, wanhat };
