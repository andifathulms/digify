/**
 * Tipe untuk panel pengawasan (/api/panel/*).
 *
 * Berbeda dari lib/types/api.ts yang mencerminkan kontrak 9 endpoint optimizer
 * dengan nama field campur Inggris-Indonesia yang sengaja dipertahankan
 * (CLAUDE.md §3). Panel bukan bagian kontrak itu, jadi namanya konsisten
 * Bahasa Indonesia — tidak menambah campuran baru.
 */

export type Ringkasan = {
  tanggal: string;
  webhook_bermasalah: number;
  kesehatan_ai: {
    panggilan_24jam: number;
    gagal_24jam: number;
    persen_gagal_24jam: number;
  };
  biaya_bulan_ini_rupiah: number;
  panggilan_bulan_ini: number;
  pembeli_aktif: number;
  belum_pernah_masuk: number;
  lisensi: {
    total: number;
    aktif: number;
    bulan_ini: number;
    rupiah_bulan_ini: number;
  };
};

export type BarisKlien = {
  id: number;
  email: string;
  nama: string;
  whatsapp: string;
  aktif: boolean;
  bergabung: string;
  terakhir_masuk: string | null;
  belum_pernah_masuk: boolean;
  panggilan_hari_ini: number;
  panggilan_bulan_ini: number;
  gagal_bulan_ini: number;
  biaya_bulan_ini_rupiah: number;
  sisa_hari_ini: number;
  sisa_bulan_ini: number;
};

export type LisensiKlien = {
  key: string;
  status: string;
  order_id: string;
  amount: number;
  activated_at: string | null;
};

export type DetailKlien = {
  id: number;
  email: string;
  nama: string;
  whatsapp: string;
  aktif: boolean;
  wajib_ganti_sandi: boolean;
  bergabung: string;
  terakhir_masuk: string | null;
  sisa_hari_ini: number;
  sisa_bulan_ini: number;
  lisensi: LisensiKlien[];
  pemakaian_per_alat: {
    endpoint: string;
    panggilan: number;
    gagal: number;
    biaya_rupiah: number;
  }[];
  panggilan_terakhir: {
    waktu: string;
    endpoint: string;
    status: string;
    lama_ms: number;
    biaya_rupiah: number;
  }[];
};

export type PeristiwaWebhook = {
  id: number;
  external_id: string;
  provider: string;
  tanda_tangan_sah: boolean;
  sudah_diproses: boolean;
  error: string;
  waktu: string;
};
