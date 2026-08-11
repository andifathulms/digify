/**
 * Pengurai daftar menu yang ditempel apa adanya — pengurang ketikan untuk
 * Tab 3 dan Tab 4.
 *
 * ── Kenapa ada ────────────────────────────────────────────────────────────
 * Umpan balik dari calon pengguna: "kira-kira ada nggak yang sistemnya nggak
 * terlalu manual nulisnya?" Daftar menu adalah bagian paling melelahkan di
 * seluruh produk — empat isian dikali sepuluh menu, dengan jempol, di HP.
 * Daftar menu tersimpan sudah menolong dari menu KEDUA dan seterusnya, tapi
 * pengisian PERTAMA tetap manual seluruhnya, dan di situlah orang menyerah.
 *
 * Kebanyakan pemilik warung sudah punya daftarnya di suatu tempat: catatan
 * HP, chat WhatsApp ke supplier, atau ekspor dari kasir/POS. Menempel lebih
 * cepat daripada mengetik ulang, dan lebih sedikit salah ketik.
 *
 * ── Kenapa di frontend, bukan endpoint ────────────────────────────────────
 * Ini aturan murni, tidak butuh AI dan tidak butuh data dari server (Tab 1-6
 * memang sudah tidak memakai AI sama sekali — DECISIONS.md 2026-07-28).
 * Menaruhnya di sini berarti tidak ada tambahan di kontrak API yang sudah
 * dibekukan, tidak ada biaya panggilan, dan tetap jalan saat aplikasi dibuka
 * offline sebagai PWA.
 *
 * ── Aturan yang dijaga ────────────────────────────────────────────────────
 * Sama seperti parser_bahan.py di backend: baris yang tidak terbaca TIDAK
 * diam-diam dianggap nol. Ia dikembalikan sebagai daftar tersendiri supaya
 * bisa ditunjukkan ke pemakainya. Angka yang kurang membuat menu rugi
 * terlihat untung — kesalahan paling mahal yang bisa dibuat alat ini.
 *
 * Bentuk yang dimengerti, boleh bercampur dalam satu tempelan:
 *
 *     Nasi Goreng Spesial | 8500 | 25000 | 70
 *     Nasi Goreng Spesial, 8.500, 25.000, 70
 *     - Es Teh Manis 1500 5000 200
 *     1. Mie Goreng Jawa 7rb 20rb 45
 *     Ayam Geprek, modal 12000, harga 22000, terjual 60
 */

import {
  bacaAngka,
  bersihkanNama,
  pemisahUntuk,
  POLA_ANGKA,
  POLA_BULLET,
  SATUAN,
} from "./uraiTeks.ts";
// Impor relatif berekstensi, bukan alias "@/": berkas ini dan ujinya
// dijalankan langsung oleh Node lewat `node --test`, dan Node tidak tahu
// apa-apa soal alias tsconfig. Bundler Next tetap bisa membacanya karena
// jalurnya memang jalur berkas sungguhan.

export type BarisMenuTerurai = {
  name: string;
  cogs: number;
  price: number;
  weeklySales: number;
};

export type HasilUraiDaftarMenu = {
  menu: BarisMenuTerurai[];
  /** Baris yang tidak bisa dibaca, apa adanya, untuk ditunjukkan ke pemakai. */
  gagal: string[];
};

/** Kata kunci kolom, kalau pemakainya menuliskannya. */
const LABEL: { pola: RegExp; kolom: "cogs" | "price" | "weeklySales" }[] = [
  { pola: /\b(modal|hpp|biaya|bahan)\b/i, kolom: "cogs" },
  { pola: /\b(harga|jual)\b/i, kolom: "price" },
  { pola: /\b(terjual|laku|jumlah|qty|porsi\s*per\s*minggu)\b/i, kolom: "weeklySales" },
];

/** Judul kolom hasil salin-tempel dari spreadsheet — bukan data. */
const POLA_JUDUL_KOLOM = /^\s*(nama|menu|item|produk)\b.*\b(harga|modal|hpp|jual)\b/i;

type Angka = { nilai: number; kolom?: "cogs" | "price" | "weeklySales" };

/**
 * Uraikan satu baris jadi satu menu.
 *
 * Urutan tanpa label adalah urutan yang sama dengan isian di layar:
 * nama, modal, harga, terjual. Kalau angkanya cuma dua, keduanya dibaca
 * sebagai modal dan harga — terjual dibiarkan nol dan pemakainya
 * melengkapinya di baris yang sudah terlihat di layar.
 */
export function uraiBarisMenu(baris: string): BarisMenuTerurai | null {
  const asli = baris.trim();
  if (!asli || POLA_JUDUL_KOLOM.test(asli)) return null;

  const teks = asli.replace(POLA_BULLET, "");

  // Angka yang diikuti satuan disembunyikan lebih dulu supaya tidak ikut
  // terbaca sebagai kolom — ia milik nama menu ("Es Teh 500ml").
  const polaBersatuan = new RegExp(String.raw`\d[\d.,]*\s*(?:${SATUAN})\b`, "gi");
  const namaTersimpan: string[] = [];
  const tanpaSatuan = teks.replace(polaBersatuan, (cocok) => {
    namaTersimpan.push(cocok);
    // Penandanya sengaja TIDAK mengandung angka. Penanda bernomor seperti
    // "0" akan terbaca lagi sebagai kolom oleh POLA_ANGKA di bawah, persis
    // kesalahan yang sedang dihindari di sini.
    if (namaTersimpan.length > 26) return cocok;
    return `@@${String.fromCharCode(96 + namaTersimpan.length)}@@`;
  });

  // Kolom bisa ditandai kata kunci di potongan yang sama, mis. "modal 8500".
  const potongan = tanpaSatuan.split(pemisahUntuk(tanpaSatuan));

  const angka: Angka[] = [];
  const sisaNama: string[] = [];

  for (const bagian of potongan) {
    const kolom = LABEL.find((label) => label.pola.test(bagian))?.kolom;
    let adaAngka = false;

    POLA_ANGKA.lastIndex = 0;
    for (const cocok of bagian.matchAll(POLA_ANGKA)) {
      const nilai = bacaAngka(cocok[1] ?? "", cocok[2]);
      if (nilai === null) continue;
      angka.push({ nilai, kolom });
      adaAngka = true;
    }

    // Bagian tanpa angka sama sekali adalah nama (atau bagian dari nama).
    if (!adaAngka) sisaNama.push(bagian);
    else if (!kolom) sisaNama.push(bagian.replace(POLA_ANGKA, " "));
  }

  const nama = bersihkanNama(
    sisaNama
      .join(" ")
      .replace(/@@([a-z])@@/g, (_, huruf: string) => namaTersimpan[huruf.charCodeAt(0) - 97] ?? ""),
  );

  if (!nama || angka.length === 0) return null;

  const hasil: BarisMenuTerurai = { name: nama, cogs: 0, price: 0, weeklySales: 0 };
  const sudahDiisi = new Set<"cogs" | "price" | "weeklySales">();

  for (const satu of angka) {
    if (satu.kolom && !sudahDiisi.has(satu.kolom)) {
      hasil[satu.kolom] = satu.nilai;
      sudahDiisi.add(satu.kolom);
    }
  }

  // Angka tanpa label mengisi kolom yang masih kosong, berurutan.
  const urutan = ["cogs", "price", "weeklySales"] as const;
  let berikutnya = 0;
  for (const satu of angka) {
    if (satu.kolom) continue;
    while (berikutnya < urutan.length && sudahDiisi.has(urutan[berikutnya]!)) berikutnya += 1;
    if (berikutnya >= urutan.length) break;
    const kolom = urutan[berikutnya]!;
    hasil[kolom] = satu.nilai;
    sudahDiisi.add(kolom);
    berikutnya += 1;
  }

  // Rupiah di produk ini tidak punya sen (CLAUDE.md §6).
  hasil.cogs = Math.round(hasil.cogs);
  hasil.price = Math.round(hasil.price);
  hasil.weeklySales = Math.round(hasil.weeklySales);

  return hasil;
}

/** Uraikan tempelan berisi banyak baris. */
export function uraiDaftarMenu(teks: string): HasilUraiDaftarMenu {
  const menu: BarisMenuTerurai[] = [];
  const gagal: string[] = [];

  for (const baris of teks.split(/\r?\n/)) {
    const bersih = baris.trim();
    if (!bersih) continue;
    if (POLA_JUDUL_KOLOM.test(bersih)) continue;

    const hasil = uraiBarisMenu(bersih);
    if (hasil) menu.push(hasil);
    else gagal.push(bersih);
  }

  return { menu, gagal };
}
