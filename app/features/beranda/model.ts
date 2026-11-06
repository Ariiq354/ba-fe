interface Periode {
  periodeMulai: string;
  periodeSelesai: string;
}

export interface DashboardResponse {
  hargaSaham: {
    hargaJual: number | null;
    perubahanNominal: number | null;
    perubahanPersen: number | null;
  };
  grafikPembiayaanTahunan: Periode & {
    data: {
      tahun: number;
      total: number;
    }[];
  };
  pembiayaanBerjalan: {
    periodeMulai: string;
    total: number;
  };
  labaBerjalan: {
    periodeMulai: string;
    total: number;
  };
  grafikLabaTahunan: {
    tahun: number;
    laba: number;
  }[];
}
