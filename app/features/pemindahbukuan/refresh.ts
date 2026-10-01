import { JURNAL_LIST_KEY } from "~/features/jurnal/keys";
import { getSaldoSimpananKey } from "~/features/simpanan/keys";
import { PEMINDAHBUKUAN_PENDING_KEY } from "./keys";

export async function refreshPemindahbukuanData(userIds: number[], refreshList: () => Promise<void>, approved = false) {
  const keys = [
    PEMINDAHBUKUAN_PENDING_KEY,
    ...[...new Set(userIds)].map(getSaldoSimpananKey),
    ...(approved ? [JURNAL_LIST_KEY] : []),
  ];
  await Promise.all([refreshList(), refreshNuxtData(keys)]);
}
