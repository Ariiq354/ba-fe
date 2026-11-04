import { getPembiayaanOptionsKey } from "~/features/pembiayaan/data";

export const ANGSURAN_LIST_KEY = "angsuran-list";
export const ANGSURAN_APPROVAL_LIST_KEY = "angsuran-approval-list";
export const ANGSURAN_PENDING_KEY = "angsuran-pending";

export async function refreshAngsuranData(userId: number) {
  await refreshNuxtData([ANGSURAN_PENDING_KEY, getPembiayaanOptionsKey(userId)]);
}
