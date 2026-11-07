import { getSaldoSimpananKey } from "~/features/simpanan/data";

export const PEMINDAHBUKUAN_LIST_KEY = "pemindahbukuan-list";
export const PEMINDAHBUKUAN_MUTASI_LIST_KEY = "pemindahbukuan-mutasi-list";
export const PEMINDAHBUKUAN_PENDING_KEY = "pemindahbukuan-pending";

export async function refreshPemindahbukuanData(
  userIds: (number | null | undefined)[],
  refreshList: () => Promise<void>,
) {
  const keys = [
    PEMINDAHBUKUAN_PENDING_KEY,
    ...[...new Set(userIds.filter((id): id is number => id != null))].map(getSaldoSimpananKey),
  ];
  await Promise.all([refreshList(), refreshNuxtData(keys)]);
}
