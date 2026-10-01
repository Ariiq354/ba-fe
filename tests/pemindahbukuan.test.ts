import type { AnggotaSimpanan, HargaSaham, SaldoSimpanan } from "../app/features/simpanan/model";
import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { canCancelPemindahbukuan, getPemindahbukuanLimit, getPemindahbukuanSchema, rejectPemindahbukuanSchema } from "../app/features/pemindahbukuan/model";
import { getAnggotaOptions } from "../app/features/simpanan/model";
import { roles } from "../app/utils/permissions";

const balance: SaldoSimpanan = {
  saldoTabungan: 2_000_000,
  totalPenarikanPending: 750_000,
  totalPemindahbukuanPending: 250_000,
  saldoEfektif: 1_000_000,
  jumlahSaham: 10,
  totalSahamPending: 4,
  jumlahSahamEfektif: 6,
};
const price: HargaSaham = { hargaJual: 75_000, hargaNominal: 50_000 };
const schema = getPemindahbukuanSchema(balance, price);
const tabungan = { tipePemindahbukuan: "tabungan_ke_tabungan", idUserSumber: 1, idUserTujuan: 2, nominal: 100_000, keterangan: "Pemindahan tabungan" };
const saham = { tipePemindahbukuan: "saham_ke_saham", idUserSumber: 1, idUserTujuan: 2, jumlahSaham: 2, keterangan: "" };
const conversion = { tipePemindahbukuan: "tabungan_ke_saham", idUserSumber: 1, idUserTujuan: 1, jumlahSaham: 2, keterangan: "" };

describe("pemindahbukuan request validation", () => {
  it("accepts the three backend workflows and strips unrelated form fields", () => {
    assert.deepEqual(schema.parse({ ...tabungan, jumlahSaham: 99 }), tabungan);
    assert.deepEqual(schema.parse({ ...saham, nominal: 99 }), saham);
    assert.deepEqual(schema.parse({ ...conversion, nominal: 99 }), conversion);
  });

  it("requires different members for transfers and the same member for conversion", () => {
    assert.equal(schema.safeParse({ ...tabungan, idUserTujuan: 1 }).success, false);
    assert.equal(schema.safeParse({ ...saham, idUserTujuan: 1 }).success, false);
    assert.equal(schema.safeParse({ ...conversion, idUserTujuan: 2 }).success, false);
  });

  it("uses available savings after both withdrawal and transfer reservations", () => {
    assert.equal(schema.safeParse({ ...tabungan, nominal: 1_000_000 }).success, true);
    assert.equal(schema.safeParse({ ...tabungan, nominal: 1_000_001 }).success, false);
  });

  it("uses available shares rather than total holdings", () => {
    assert.equal(schema.safeParse({ ...saham, jumlahSaham: 6 }).success, true);
    assert.equal(schema.safeParse({ ...saham, jumlahSaham: 7 }).success, false);
  });

  it("checks conversion cost against the selling price", () => {
    const limitedSchema = getPemindahbukuanSchema({ ...balance, saldoEfektif: 150_000 }, price);
    assert.equal(limitedSchema.safeParse(conversion).success, true);
    assert.equal(limitedSchema.safeParse({ ...conversion, jumlahSaham: 3 }).success, false);
  });

  it("requires a loaded balance and a selling price for conversion", () => {
    assert.equal(getPemindahbukuanSchema().safeParse(tabungan).success, false);
    assert.equal(getPemindahbukuanSchema(balance).safeParse(saham).success, true);
    assert.equal(getPemindahbukuanSchema(balance).safeParse(conversion).success, false);
    assert.equal(getPemindahbukuanSchema(balance, { ...price, hargaJual: 0 }).safeParse(conversion).success, false);
  });

  it("rejects missing, nonpositive, fractional, nonfinite and overflowing amounts", () => {
    for (const amount of [undefined, 0, -1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 2_147_483_648]) {
      assert.equal(schema.safeParse({ ...tabungan, nominal: amount }).success, false);
      assert.equal(schema.safeParse({ ...saham, jumlahSaham: amount }).success, false);
      assert.equal(schema.safeParse({ ...conversion, jumlahSaham: amount }).success, false);
    }
  });

  it("requires valid source and destination IDs", () => {
    for (const id of [undefined, 0, -1, 0.5, 2_147_483_648]) {
      assert.equal(schema.safeParse({ ...tabungan, idUserSumber: id }).success, false);
      assert.equal(schema.safeParse({ ...tabungan, idUserTujuan: id }).success, false);
    }
  });

  it("bounds share reference amounts to the PostgreSQL integer limit", () => {
    const largeBalance = { ...balance, jumlahSahamEfektif: 100_000, saldoEfektif: 2_147_483_647 };
    const largeSchema = getPemindahbukuanSchema(largeBalance, { ...price, hargaJual: 40_000 });
    assert.equal(largeSchema.safeParse({ ...saham, jumlahSaham: 42_949 }).success, true);
    assert.equal(largeSchema.safeParse({ ...saham, jumlahSaham: 42_950 }).success, false);
    assert.equal(largeSchema.safeParse({ ...conversion, jumlahSaham: 42_949 }).success, true);
    assert.equal(largeSchema.safeParse({ ...conversion, jumlahSaham: 42_950 }).success, false);
  });

  it("bounds conversion cost independently of share reference value", () => {
    const largeBalance = { ...balance, saldoEfektif: 2_147_483_647 };
    const largeSchema = getPemindahbukuanSchema(largeBalance, price);
    assert.equal(largeSchema.safeParse({ ...conversion, jumlahSaham: 28_633 }).success, true);
    assert.equal(largeSchema.safeParse({ ...conversion, jumlahSaham: 28_634 }).success, false);
  });

  it("handles missing/fully reserved balances and computes whole-share limits", () => {
    assert.equal(getPemindahbukuanLimit("tabungan_ke_tabungan"), 0);
    assert.equal(getPemindahbukuanLimit("tabungan_ke_saham", balance), 0);
    assert.equal(getPemindahbukuanLimit("tabungan_ke_saham", balance, price), 13);
    assert.equal(getPemindahbukuanLimit("saham_ke_saham", { ...balance, jumlahSahamEfektif: 0 }), 0);
    assert.equal(getPemindahbukuanLimit("tabungan_ke_tabungan", { ...balance, saldoEfektif: 0 }), 0);
  });

  it("requires a nonblank rejection reason", () => {
    assert.equal(rejectPemindahbukuanSchema.safeParse({ alasanPenolakan: "  " }).success, false);
    assert.deepEqual(rejectPemindahbukuanSchema.parse({ alasanPenolakan: "  Alasan  " }), { alasanPenolakan: "Alasan" });
  });
});

describe("pemindahbukuan access", () => {
  const pending = { statusApproved: "pending", idUserSumber: 1, createdBy: 9 };

  it("allows the source owner or creator to cancel while the source is accessible", () => {
    assert.equal(canCancelPemindahbukuan({ ...pending, statusApproved: "pending" }, 1, [1]), true);
    assert.equal(canCancelPemindahbukuan({ ...pending, statusApproved: "pending" }, 9, [1]), true);
  });

  it("does not grant cancellation to a recipient or a creator who lost source access", () => {
    assert.equal(canCancelPemindahbukuan({ ...pending, statusApproved: "pending" }, 2, [2]), false);
    assert.equal(canCancelPemindahbukuan({ ...pending, statusApproved: "pending" }, 9, [9]), false);
    assert.equal(canCancelPemindahbukuan({ ...pending, statusApproved: "approved" }, 1, [1]), false);
    assert.equal(canCancelPemindahbukuan({ ...pending, statusApproved: "rejected" }, 9, [1]), false);
  });

  it("allows all registered roles to submit and only admin to approve", () => {
    for (const role of Object.values(roles))
      assert.equal(role.authorize({ pemindahbukuan: ["view", "manage"] }).success, true);
    assert.equal(roles.admin.authorize({ approvalPemindahbukuan: ["view", "manage"] }).success, true);
    assert.equal(roles.user.authorize({ approvalPemindahbukuan: ["manage"] }).success, false);
    assert.equal(roles.pj.authorize({ approvalPemindahbukuan: ["manage"] }).success, false);
  });

  it("disables users without membership numbers in source/destination choices", () => {
    const members: AnggotaSimpanan[] = [
      { id: 1, name: "Budi", noAnggota: "A001", idKelompok: 1, namaKelompok: "Kelompok A" },
      { id: 2, name: "Siti", noAnggota: null, idKelompok: 2, namaKelompok: "Kelompok B" },
      { id: 3, name: "Agus", noAnggota: " ", idKelompok: 2, namaKelompok: "Kelompok B" },
    ];
    assert.deepEqual(getAnggotaOptions(members).map(member => member.disabled), [false, true, true]);
  });
});
