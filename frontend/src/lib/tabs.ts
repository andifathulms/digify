/** Daftar 10 tab. Satu tempat, dipakai navigasi dan judul halaman. */

export type Kelompok = "Profit" | "Growth";

export type Tab = {
  slug: string;
  nomor: number;
  judul: string;
  ringkas: string;
  kelompok: Kelompok;
};

/**
 * Nama kelompok yang DILIHAT pengguna.
 *
 * Kunci "Profit"/"Growth" tetap istilah dalam kode — dipakai untuk menyaring
 * dan mewarnai. Yang berubah hanya labelnya, dan itu memang harus berubah:
 * "Mesin Growth" tercetak di sidebar, di kepala tiap alat, dan di halaman
 * depan pada bagian yang justru bertugas menerangkan isi produk. "Growth"
 * bukan kata yang dipakai pemilik warung, dan CLAUDE.md §3.3 memang melarang
 * bahasa Inggris di teks yang dilihat pengguna.
 *
 * Ditulis di sini, bukan diulang di empat berkas seperti sebelumnya —
 * dulu nama yang sama diketik ulang di DaftarAlat, JudulTab, halaman alat,
 * dan halaman depan, jadi mengubahnya berarti empat kesempatan untuk lupa.
 */
export const NAMA_KELOMPOK: Record<Kelompok, string> = {
  Profit: "Rapikan Untung",
  Growth: "Tambah Pembeli",
};

export const TABS: readonly Tab[] = [
  {
    slug: "biaya-menu",
    nomor: 1,
    judul: "Biaya Menu",
    ringkas: "Hitung biaya bahan asli per porsi dari daftar bahan yang Anda tulis bebas.",
    kelompok: "Profit",
  },
  {
    slug: "harga-jual",
    nomor: 2,
    judul: "Harga Jual",
    ringkas: "Cari harga yang benar untuk di tempat dan untuk aplikasi ojol.",
    kelompok: "Profit",
  },
  {
    slug: "ranking",
    nomor: 3,
    judul: "Ranking Menu",
    ringkas: "Urutkan menu dari yang paling menyumbang profit seminggu.",
    kelompok: "Profit",
  },
  {
    slug: "optimasi-menu",
    nomor: 4,
    judul: "Optimasi Menu",
    ringkas: "Menu mana yang dihentikan, didorong, diperbaiki harganya, atau dipaketkan.",
    kelompok: "Profit",
  },
  {
    slug: "laporan",
    nomor: 5,
    judul: "Laporan Final",
    ringkas: "Rangkum semua perubahan menu jadi satu laporan yang bisa disimpan.",
    kelompok: "Profit",
  },
  {
    slug: "waste",
    nomor: 6,
    judul: "Bahan Terbuang",
    ringkas: "Lacak bahan yang terbuang dan berapa rupiah yang hilang karenanya.",
    kelompok: "Profit",
  },
  {
    slug: "ide-menu",
    nomor: 7,
    judul: "Ide Menu Baru",
    ringkas: "Minta ide menu baru yang modalnya masih masuk akal untuk warung Anda.",
    kelompok: "Growth",
  },
  {
    slug: "konten-promosi",
    nomor: 8,
    judul: "Konten Promosi",
    ringkas: "Caption, hashtag, dan waktu posting yang pas untuk menu Anda.",
    kelompok: "Growth",
  },
  {
    slug: "carousel-teks",
    nomor: 9,
    judul: "Naskah Carousel",
    ringkas: "Susun alur cerita carousel beserta petunjuk fotonya.",
    kelompok: "Growth",
  },
  {
    slug: "carousel-gambar",
    nomor: 10,
    judul: "Gambar Carousel",
    ringkas: "Ubah carousel jadi gambar siap posting yang bisa langsung diunduh.",
    kelompok: "Growth",
  },
] as const;

export function cariTab(slug: string): Tab | undefined {
  return TABS.find((tab) => tab.slug === slug);
}
