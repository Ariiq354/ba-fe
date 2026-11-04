export interface LaporanAkun<Kategori extends string> {
  id: number;
  namaAkun: string;
  kategori: Kategori;
  jumlahBulanan: number[];
  jumlah: number;
}

export interface NeracaResponse {
  data: LaporanAkun<"aktiva" | "pasiva">[];
  ringkasan: {
    aktivaBulanan: number[];
    pasivaBulanan: number[];
    totalAktiva: number;
    totalPasiva: number;
  };
}

export interface LabaRugiResponse {
  data: LaporanAkun<"pendapatan" | "biaya">[];
  ringkasan: {
    pendapatanBulanan: number[];
    biayaBulanan: number[];
    labaRugiBulanan: number[];
    totalPendapatan: number;
    totalBiaya: number;
    totalLabaRugi: number;
  };
}

export interface RingkasanLaporan {
  label: string;
  jumlahBulanan: number[];
  jumlah: number;
}

export interface BagianLaporan extends RingkasanLaporan {
  akun: LaporanAkun<string>[];
}

export const bulanLaporan = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];
