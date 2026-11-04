export const PEMBIAYAAN_LIST_KEY = "pembiayaan-list";
export const PEMBIAYAAN_APPROVAL_LIST_KEY = "pembiayaan-approval-list";
export const PEMBIAYAAN_PENDING_KEY = "pembiayaan-pending";

export function getPembiayaanOptionsKey(userId: number) {
  return `pembiayaan-options-${userId}`;
}

export async function refreshPembiayaanData(refreshList: () => Promise<void>) {
  await Promise.all([refreshList(), refreshNuxtData(PEMBIAYAAN_PENDING_KEY)]);
}
