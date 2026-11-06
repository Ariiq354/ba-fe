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
  grafikPembiayaanTahunan: Periode & {
    data: {
      tahun: number;
      total: number;
    }[];
  };
  pembiayaanBerjalan: Periode & {
    total: number;
  };
  labaBerjalan: Periode & {
    total: number;
  };
  grafikLabaTahunan: {
    tahun: number;
    pendapatan: number;
    biaya: number;
    laba: number;
  }[];
}
