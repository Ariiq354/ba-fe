import { JURNAL_LIST_KEY } from "~/features/jurnal/data";
import { getSaldoSimpananKey } from "~/features/simpanan/data";

export const PEMINDAHBUKUAN_LIST_KEY = "pemindahbukuan-list";
export const PEMINDAHBUKUAN_APPROVAL_LIST_KEY = "pemindahbukuan-approval-list";
export const PEMINDAHBUKUAN_PENDING_KEY = "pemindahbukuan-pending";

export async function refreshPemindahbukuanData(userIds: number[], refreshList: () => Promise<void>, approved = false) {
  const keys = [
    PEMINDAHBUKUAN_PENDING_KEY,
    ...[...new Set(userIds)].map(getSaldoSimpananKey),
    ...(approved ? [JURNAL_LIST_KEY] : []),
  ];
  await Promise.all([refreshList(), refreshNuxtData(keys)]);
}
