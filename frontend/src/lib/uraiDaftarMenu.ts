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

/** Penanda daftar di awal baris: "-", "*", "•", "1.", "2)". */
const POLA_BULLET = /^\s*(?:[-*•·]|\d+[.)])\s+/;

/** Judul kolom hasil salin-tempel dari spreadsheet — bukan data. */
const POLA_JUDUL_KOLOM = /^\s*(nama|menu|item|produk)\b.*\b(harga|modal|hpp|jual)\b/i;

/**
 * Satuan yang menempel pada angka di dalam NAMA menu: "Es Teh 500ml",
 * "Kopi 250 gr". Angka bersatuan bukan modal, bukan harga, bukan jumlah
 * terjual — ia bagian dari nama. Tanpa penjagaan ini "Es Teh 500ml" membuat
 * 500 terbaca sebagai modal dan seluruh barisnya melenceng satu kolom.
 */
const SATUAN_NAMA = "ml|l|liter|g|gr|gram|kg|ons|pcs|pc|porsi|cup|botol";

/** Akhiran ribuan yang lazim ditulis pemilik warung: "7rb", "20k", "5 ribu". */
const AKHIRAN_RIBU = "rb|ribu|k";

/**
 * Satu angka uang/jumlah: boleh diawali "Rp", boleh berakhiran "rb"/"k".
 * Sengaja TIDAK cocok dengan angka yang diikuti satuan nama (lihat di atas) —
 * itu diurus saat pemilahan.
 */
const POLA_ANGKA = new RegExp(
  String.raw`(?:rp\.?\s*)?(\d[\d.]*(?:,\d{1,2}(?!\d))?)\s*(${AKHIRAN_RIBU})?\b`,
  "gi",
);

/**
 * Pemisah antar kolom: garis tegak, titik koma, tab, atau koma.
 *
 * Koma menanggung dua tugas berbeda dalam bahasa Indonesia — pemisah daftar
 * DAN pemisah desimal. `,(?!\d)` yang membedakannya: koma yang langsung
 * diikuti angka ("1500,6") adalah desimal dan tidak boleh memotong.
 * Tanpa itu "1500,6" terpecah jadi 1500 dan 6, dan seluruh kolom sesudahnya
 * bergeser satu tempat — modal terbaca jadi harga jual.
 *
 * Sisa lookahead-nya menjaga supaya nama bertanda koma ("Nasi Goreng, Spesial")
 * tidak ikut terpotong: koma baru dianggap pemisah kalau setelahnya memang
 * ada angka, boleh didahului kata kunci kolom.
 */
const POLA_PISAH = /[|;\t]|,(?!\d)(?=\s*(?:[a-z]+\s*)?(?:rp\.?\s*)?\d)/i;

/**
 * Pemisah untuk baris bergaya CSV, yang komanya ditulis rapat tanpa spasi:
 * `Nasi Uduk,6000,15000,30`. Bentuk ini datang dari ekspor kasir/POS, dan
 * itu justru asal-usul yang paling ingin kita layani.
 */
const POLA_PISAH_RAPAT = /[|;\t,]/;

/**
 * Berapa banyak koma yang langsung menempel angka dalam satu baris.
 *
 * Dipakai untuk memutuskan arti koma SEKALI untuk seluruh baris, bukan per
 * koma. Satu koma rapat hampir pasti desimal ("1.250,5"); dua atau lebih
 * hampir pasti pemisah kolom, karena angka desimal berturut-turut tidak
 * pernah muncul di daftar menu — modal, harga, dan jumlah terjual semuanya
 * bilangan bulat (rupiah di produk ini tidak punya sen, CLAUDE.md §6).
 *
 * Memutuskannya per baris, bukan per koma, supaya satu baris tidak pernah
 * setengah dibaca sebagai desimal dan setengah sebagai pemisah.
 */
function jumlahKomaRapat(teks: string): number {
  return (teks.match(/,(?=\d)/g) ?? []).length;
}

/** Kata kunci kolom, kalau pemakainya menuliskannya. */
const LABEL: { pola: RegExp; kolom: "cogs" | "price" | "weeklySales" }[] = [
  { pola: /\b(modal|hpp|biaya|bahan)\b/i, kolom: "cogs" },
  { pola: /\b(harga|jual)\b/i, kolom: "price" },
  { pola: /\b(terjual|laku|jumlah|qty|porsi\s*per\s*minggu)\b/i, kolom: "weeklySales" },
];

/**
 * Baca angka gaya Indonesia — titik pemisah ribuan, koma pemisah desimal.
 * Sengaja sama perilakunya dengan `baca_angka` di backend
 * (apps/optimizer/aturan/satuan.py) supaya angka yang sama tidak pernah
 * terbaca dua arti di dua tempat.
 *
 *     "8.000"   → 8000
 *     "2,5"     → 2.5
 *     "7rb"     → 7000
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
function bersihkanNama(teks: string): string {
  return teks
    .replace(/[|;,\t]+/g, " ")
    .replace(/[\s,;:.\-–—]+$/, "")
    .replace(/^[\s,;:.\-–—]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

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
  const polaBersatuan = new RegExp(String.raw`\d[\d.,]*\s*(?:${SATUAN_NAMA})\b`, "gi");
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
  const potongan = tanpaSatuan.split(
    jumlahKomaRapat(tanpaSatuan) >= 2 ? POLA_PISAH_RAPAT : POLA_PISAH,
  );

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
