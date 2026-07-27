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
 * Nilainya harus sama persis dengan styles/tokens.css.
 */

export const WARNA = {
  biruDeep: "#0F4C97",
  biru: "#1868C7",
  biruLight: "#2E9BF0",
  oranye: "#F2790C",
  putih: "#FFFFFF",
  tinta: "#132238",
  tintaRedup: "#5E6C82",
  krem: "#F7F1E6",
  garis: "#DFE6F0",
} as const;

/** Ukuran asli slide: 4:5, ukuran yang diminta Instagram. */
export const LEBAR_SLIDE = 1080;
export const TINGGI_SLIDE = 1350;
