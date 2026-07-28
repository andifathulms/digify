/**
 * Tipe yang mencerminkan docs/API_CONTRACT.md.
 *
 * Campuran nama Inggris–Indonesia (`cogs_per_portion` bersebelahan dengan
 * `ringkasan_periode`) DISENGAJA dan dikunci untuk v1. Lapisan tipe inilah
 * tempat keanehan itu didokumentasikan — bukan tempat memperbaikinya.
 * Merapikannya di sini berarti frontend dan backend bicara bahasa berbeda.
 */

export type StatusMenu = "GREEN" | "YELLOW" | "RED";

// --- Tab 1 · Biaya Menu ----------------------------------------------------

export type BiayaMenuRequest = {
  itemName: string;
  ingredientsList: string;
  portionWeight: number;
  currentPrice: number;
};

export type RincianBahan = {
  nama: string;
  jumlah: number;
  satuan: string;
  /** Harga per satuan dasar — 8 per "gram". Dipakai berhitung, bukan ditampilkan. */
  harga_satuan: number;
  biaya: number;
  /** Harga belanja persis seperti yang ditulis pemiliknya — 8000 per "kg". */
  harga_beli: number;
  satuan_beli: string;
};

export type BiayaMenuResponse = {
  item_name: string;
  ingredients_breakdown: RincianBahan[];
  cogs_per_portion: number;
  current_margin_percentage: number;
  food_waste_percentage: number;
};

// --- Tab 2 · Harga Jual ----------------------------------------------------

export type HargaJualRequest = {
  itemName: string;
  cogs: number;
  targetMargin: number;
  competitorPrice: number | null;
  platformFeePercent: number;
  location: string;
};

export type HargaJualResponse = {
  item_name: string;
  dine_in_recommended: number;
  delivery_recommended: number;
  psychological_price: number;
  margin_at_recommended: number;
  break_even_dine_in: number;
  break_even_delivery: number;
};

// --- Tab 3 · Ranking Profitabilitas ---------------------------------------

export type MenuUntukRanking = {
  name: string;
  cogs: number;
  price: number;
  weeklySales: number;
};

export type RankingRequest = { menuItems: MenuUntukRanking[] };

export type BarisRanking = {
  rank: number;
  item: string;
  weekly_profit: number;
  margin_percentage: number;
  status: StatusMenu;
  action: string;
};

export type RankingResponse = {
  rankings: BarisRanking[];
  total_weekly_profit: number;
  items_to_promote: number;
  items_to_reprice: number;
  items_to_remove: number;
};

// --- Tab 4 · Optimasi Menu -------------------------------------------------

export type MenuUntukOptimasi = MenuUntukRanking & {
  margin: number;
  status: StatusMenu | "";
};

export type OptimasiMenuRequest = {
  menuItems: MenuUntukOptimasi[];
  minItems: number;
  peakHours: string;
};

export type Rekomendasi = {
  item: string;
  alasan: string;
  aksi: string;
  estimasi_dampak: number;
};

export type OptimasiMenuResponse = {
  remove: Rekomendasi[];
  promote: Rekomendasi[];
  reprice: Rekomendasi[];
  bundle: Rekomendasi[];
  total_estimated_impact: number;
};

// --- Tab 5 · Laporan Final -------------------------------------------------

export type MenuUntukLaporan = {
  name: string;
  cogs: number;
  oldPrice: number;
  newPrice: number;
  margin: number;
  weeklySales: number;
};

export type LaporanRequest = {
  restaurantName: string;
  date: string;
  menuItems: MenuUntukLaporan[];
};

export type BarisLaporan = {
  nama_menu: string;
  biaya_bahan: number;
  harga_lama: number;
  harga_baru: number;
  margin: number;
  terjual_per_minggu: number;
  catatan: string;
};

export type LaporanResponse = {
  nama_restoran: string;
  tanggal: string;
  menu_items: BarisLaporan[];
  ringkasan: {
    total_item: number;
    item_direprice: number;
    estimasi_kenaikan_profit_bulanan: number;
    catatan_penutup: string;
  };
};

// --- Tab 6 · Waste Tracker -------------------------------------------------

export type BahanWaste = {
  nama: string;
  jumlahBeli: number;
  satuan: string;
  hargaSatuan: number;
  jumlahTerbuang: number;
  penyebab: string;
};

export type WasteRequest = { periode: string; bahanList: BahanWaste[] };

export type RincianWaste = {
  nama: string;
  persentase_terbuang: number;
  nilai_rupiah: number;
  dugaan_penyebab: string;
};

export type WasteResponse = {
  ringkasan_periode: string;
  waste_breakdown: RincianWaste[];
  total_nilai_waste_rupiah: number;
  bahan_paling_boros_persen: string;
  bahan_paling_boros_rupiah: string;
  rekomendasi: string[];
  estimasi_penghematan_bulanan: number;
};

// --- Tab 7 · Ide Menu ------------------------------------------------------

export type MenuExisting = { name: string; price: number; margin: number };

export type IdeMenuRequest = {
  existingMenu: MenuExisting[];
  kondisi: string;
  targetPelanggan: string;
  maxCogs: number;
  jumlahIde: number;
};

export type IdeMenu = {
  nama: string;
  kategori: string;
  kesulitan: string;
  deskripsi: string;
  bahan: string[];
  cogs: number;
  harga: number;
  margin: number;
  alasan: string;
};

export type IdeMenuResponse = {
  ringkasan_analisa: string;
  ide_menu: IdeMenu[];
  tips_eksekusi: string[];
};

// --- Tab 8 · Konten Promosi ------------------------------------------------

export type KontenPromosiRequest = {
  namaMenu: string;
  keunggulan: string;
  platform: string;
  gaya: string;
  infoPromo: string;
};

export type KontenPromosiResponse = {
  caption_utama: string;
  caption_alternatif: string[];
  hashtag_rekomendasi: string[];
  ide_visual: string;
  call_to_action: string;
  waktu_posting_ideal: string;
};

// --- Tab 9 & 10 · Carousel -------------------------------------------------
// Satu endpoint, dua tab. Tab 10 hanya merender payload yang sama jadi gambar.

export type CarouselRequest = KontenPromosiRequest & { jumlahSlide: number };

export type SlideCarousel = {
  nomor_slide: number;
  tipe_slide: string;
  teks_slide: string;
  petunjuk_foto: string;
};

export type CarouselResponse = {
  ringkasan_konsep: string;
  slides: SlideCarousel[];
  caption_post: string;
  hashtag_rekomendasi: string[];
};
