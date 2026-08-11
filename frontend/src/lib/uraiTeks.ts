/**
 * Aturan dasar membaca daftar yang ditulis bebas.
 *
 * Dipakai bersama oleh pengurai daftar menu (Tab 3 & 4) dan pengurai daftar
 * bahan terbuang (Tab 6). Ditaruh di satu tempat karena aturan angkanya HARUS
 * sama di keduanya: titik pemisah ribuan, koma pemisah desimal. Angka yang
 * sama tidak boleh punya dua arti di dua layar yang berbeda — dan kalau
 * salinannya ada dua, cepat atau lambat keduanya berbeda.
 *
 * Perilakunya sengaja mengikuti `baca_angka` di backend
 * (apps/optimizer/aturan/satuan.py), yang mengurus daftar bahan Tab 1.
 */

/** Penanda daftar di awal baris: "-", "*", "•", "1.", "2)". */
export const POLA_BULLET = /^\s*(?:[-*•·]|\d+[.)])\s+/;

/** Akhiran ribuan yang lazim ditulis pemilik warung: "7rb", "20k", "5 ribu". */
export const AKHIRAN_RIBU = "rb|ribu|k";

/** Satuan yang lazim menempel pada angka: "500ml", "250 gr", "2 kg". */
export const SATUAN = "ml|l|liter|g|gr|gram|kg|ons|pcs|pc|porsi|cup|botol|butir|ikat|buah";

/**
 * Satu angka uang/jumlah: boleh diawali "Rp", boleh berakhiran "rb"/"k".
 *
 * Bagian desimalnya dibatasi satu-dua angka DAN tidak boleh diikuti angka
 * lagi. Tanpa batas itu "8500,25000,70" terbaca sebagai satu angka raksasa
 * alih-alih tiga kolom.
 */
export const POLA_ANGKA = new RegExp(
  String.raw`(?:rp\.?\s*)?(\d[\d.]*(?:,\d{1,2}(?!\d))?)\s*(${AKHIRAN_RIBU})?\b`,
  "gi",
);

/**
 * Pemisah antar kolom: garis tegak, titik koma, tab, atau koma.
 *
 * Koma menanggung dua tugas berbeda dalam bahasa Indonesia — pemisah daftar
 * DAN pemisah desimal. `,(?!\d)` yang membedakannya: koma yang langsung
 * diikuti angka ("1500,6") adalah desimal dan tidak boleh memotong. Tanpa itu
 * "1500,6" terpecah jadi 1500 dan 6, dan seluruh kolom sesudahnya bergeser
 * satu tempat — modal terbaca jadi harga jual.
 *
 * Sisa lookahead-nya menjaga supaya nama bertanda koma ("Nasi Goreng, Spesial")
 * tidak ikut terpotong: koma baru dianggap pemisah kalau setelahnya memang ada
 * angka, boleh didahului kata kunci kolom.
 */
export const POLA_PISAH = /[|;\t]|,(?!\d)(?=\s*(?:[a-z]+\s*)?(?:rp\.?\s*)?\d)/i;

/**
 * Pemisah untuk baris bergaya CSV, yang komanya ditulis rapat tanpa spasi:
 * `Nasi Uduk,6000,15000,30`. Bentuk ini datang dari ekspor kasir/POS, dan itu
 * justru asal-usul yang paling ingin dilayani.
 */
export const POLA_PISAH_RAPAT = /[|;\t,]/;

/**
 * Berapa banyak koma yang langsung menempel angka dalam satu baris.
 *
 * Dipakai untuk memutuskan arti koma SEKALI untuk seluruh baris, bukan per
 * koma. Satu koma rapat hampir pasti desimal ("1.250,5"); dua atau lebih
 * hampir pasti pemisah kolom gaya CSV.
 *
 * Memutuskannya per baris, bukan per koma, supaya satu baris tidak pernah
 * setengah dibaca sebagai desimal dan setengah sebagai pemisah.
 */
export function jumlahKomaRapat(teks: string): number {
  return (teks.match(/,(?=\d)/g) ?? []).length;
}

/**
 * Pilih pemisah yang tepat untuk satu baris.
 *
 * Kalau barisnya sudah punya pemisah yang tidak ambigu — garis tegak, titik
 * koma, atau tab — maka koma di baris itu PASTI desimal, apa pun jumlahnya.
 * Pemeriksaan ini harus didahulukan: daftar bahan terbuang wajar berisi dua
 * pecahan berturut-turut ("1,5 kg | 0,25"), dan tanpa aturan ini keduanya
 * terbaca sebagai pemisah kolom lalu "1,5" jadi 1.
 *
 * Baru kalau tidak ada pemisah tegas, banyaknya koma rapat yang memutuskan.
 */
export function pemisahUntuk(teks: string): RegExp {
  if (/[|;\t]/.test(teks)) return POLA_PISAH;
  return jumlahKomaRapat(teks) >= 2 ? POLA_PISAH_RAPAT : POLA_PISAH;
}

/**
 * Baca angka gaya Indonesia — titik pemisah ribuan, koma pemisah desimal.
 *
 *     "8.000"   → 8000
 *     "2,5"     → 2.5
 *     "7" + rb  → 7000
 *
 * Titik hanya dianggap pemisah ribuan kalau diikuti tepat tiga angka; tanpa
 * aturan itu "2.5" (dua setengah) terbaca 25.
 */
export function bacaAngka(teks: string, akhiran?: string): number | null {
  const bersih = teks.trim().replace(/\s/g, "");
  if (!bersih) return null;

  const tanpaRibuan = bersih.replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const nilai = Number(tanpaRibuan);
  if (!Number.isFinite(nilai)) return null;

  return akhiran ? nilai * 1000 : nilai;
}

/** Buang tanda baca pemisah yang tersisa di ujung nama. */
export function bersihkanNama(teks: string): string {
  return teks
    .replace(/[|;,\t]+/g, " ")
    .replace(/[\s,;:.\-–—]+$/, "")
    .replace(/^[\s,;:.\-–—]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
