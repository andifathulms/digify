/** Daftar 10 tab. Satu tempat, dipakai navigasi dan judul halaman. */

export type Tab = {
  slug: string;
  nomor: number;
  judul: string;
  ringkas: string;
  kelompok: "Profit" | "Growth";
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
    judul: "Waste Tracker",
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
    judul: "Carousel (Teks)",
    ringkas: "Susun alur cerita carousel beserta petunjuk fotonya.",
    kelompok: "Growth",
  },
  {
    slug: "carousel-gambar",
    nomor: 10,
    judul: "Carousel (Gambar)",
    ringkas: "Ubah carousel jadi gambar siap posting yang bisa langsung di-download.",
    kelompok: "Growth",
  },
] as const;

export function cariTab(slug: string): Tab | undefined {
  return TABS.find((tab) => tab.slug === slug);
}
