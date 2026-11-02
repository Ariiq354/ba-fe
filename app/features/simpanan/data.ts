export const APPROVAL_SIMPANAN_PENDING_KEY = "approval-simpanan-pending";

export function getSaldoSimpananKey(userId: number) {
  return `simpanan-saldo-${userId}`;
}
