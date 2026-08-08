/**
 * Warna slide carousel — HEX LITERAL, sengaja tidak memakai token CSS.
 *
 * Ini satu-satunya tempat di frontend yang boleh menulis hex mentah, dan
 * alasannya teknis: html2canvas membaca warna hasil komputasi dari DOM.
 * Tailwind v4 menuliskan warnanya sebagai `oklch()`, dan parser html2canvas
 * asli tidak mengenalnya — hasilnya PNG keluar hitam atau kosong
 * (CLAUDE.md §9.1). Kita sudah memakai html2canvas-pro yang paham `oklch`,
 * tapi mengunci warna slide sebagai hex adalah lapis pengaman kedua: fitur
 * ini yang paling tidak boleh turun kualitasnya saat porting (PRD §5 Tab 10).
 *
 * Nilainya harus sama persis dengan `styles/tokens.css`. Sampai 8 Agustus 2026
 * kalimat itu tidak benar — `tinta`, `tintaRedup`, dan `garis` tidak pernah
 * cocok, dan `oranye` tertinggal saat kontras token diperbaiki. Karena berkas
 * ini yang dipanggang ke dalam PNG yang diunduh lalu diposting, warna yang
 * melenceng di sini tidak bisa ditarik kembali setelah gambarnya tersebar.
 *
 * ── Kontras ────────────────────────────────────────────────────────────────
 * Slide dibaca sebagai gambar 1080×1350 di layar HP selebar ~400px, jadi teks
 * berukuran 30px pada slide tampil kecil di mata pembaca. Diukur sebagai teks
 * normal, bukan teks besar:
 *
 *   tinta       di atas putih      16,77:1
 *   tintaRedup  di atas putih       5,90:1
 *   oranyeTeks  di atas putih       5,48:1   (dulu #F2790C — 2,79:1)
 *   biruPucat   di atas biruDeep    5,36:1   (dulu #2E9BF0 — 2,82:1)
 *   putih       di atas biru         5,46:1
 *   putih       di atas biruDeep     8,40:1
 *   biruDeep    di atas putih        8,40:1
 */

export const WARNA = {
  /* Struktur — sama dengan --blue-700 / --blue-500 di tokens.css. */
  biruDeep: "#0F4C97",
  biru: "#1868C7",

  /* Label pada slide penutup (teks di atas latar biru pekat).
   * Menggantikan --blue-400 #2E9BF0, yang hanya 2,82:1 di sana. */
  biruPucat: "#B7D1F1",

  /* Oranye dipecah dua, sebab tugasnya memang dua:
   *  - `oranye` untuk garis penanda di puncak slide penutup. Batang warna
   *    tanpa teks, jadi oranye brand yang terang justru yang benar.
   *  - `oranyeTeks` untuk label tipe slide di atas kartu putih. Oranye terang
   *    sebagai teks hanya 2,79:1 — separuh dari yang dibutuhkan. */
  oranye: "#F2790C",
  oranyeTeks: "#A95000",

  putih: "#FFFFFF",
  tinta: "#101E31",
  tintaRedup: "#57657C",
  krem: "#F7F1E6",
  garis: "#E0E7F1",
} as const;

/** Ukuran asli slide: 4:5, ukuran yang diminta Instagram. */
export const LEBAR_SLIDE = 1080;
export const TINGGI_SLIDE = 1350;
