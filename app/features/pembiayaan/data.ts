import { JURNAL_LIST_KEY } from "~/features/jurnal/data";

export const PEMBIAYAAN_LIST_KEY = "pembiayaan-list";
export const PEMBIAYAAN_APPROVAL_LIST_KEY = "pembiayaan-approval-list";
export const PEMBIAYAAN_PENDING_KEY = "pembiayaan-pending";

export function getPembiayaanOptionsKey(userId: number) {
  return `pembiayaan-options-${userId}`;
}

export async function refreshPembiayaanData(
  refreshList: () => Promise<void>,
  journalChanged = false,
) {
  await Promise.all([
    refreshList(),
    refreshNuxtData([PEMBIAYAAN_PENDING_KEY, ...(journalChanged ? [JURNAL_LIST_KEY] : [])]),
  ]);
}
