interface Periode {
  periodeMulai: string;
  periodeSelesai: string;
}

export interface DashboardResponse {
  hargaSaham: {
    hargaNominal: number;
    hargaJual: number | null;
    diperbaruiPada: string | null;
    hargaSebelumnya: number | null;
    perubahanNominal: number | null;
    perubahanPersen: number | null;
  };
  grafikHargaSaham: Periode & {
    data: {
      bulan: string;
      hargaJual: number | null;
    }[];
  };
  labaBerjalan: Periode & {
    total: number;
  };
  grafikLabaBulanan: {
    bulan: string;
    pendapatan: number;
    biaya: number;
    laba: number;
  }[];
}
