import {
  bacaAngka,
  bersihkanNama,
  pemisahUntuk,
  POLA_ANGKA,
  POLA_BULLET,
  SATUAN,
} from "./uraiTeks.ts";

/**
 * Pengurai daftar bahan terbuang — pengurang ketikan untuk Tab 6.
 *
 * ── Kenapa justru tab ini ─────────────────────────────────────────────────
 * Tab 6 adalah form paling berat di seluruh produk: ENAM isian per bahan,
 * dikali sepuluh bahan, dengan jempol. Ironisnya ia juga tab yang datanya
 * paling mirip catatan belanja — bentuk yang memang sudah dimiliki orangnya,
 * dan yang sudah terbukti bisa diurai di Tab 1.
 *
 * ── Urutan tanpa label mengikuti urutan di layar ──────────────────────────
 * nama, jumlah beli, jumlah terbuang, harga per satuan. Sama dengan urutan
 * isian yang dilihat pemakainya, bukan urutan field di dalam kode — yang
 * dibaca orang saat menulis daftarnya adalah layar.
 *
 * Satuan tidak menempati posisi sendiri: ia ikut menempel pada angkanya
 * ("1000 gram"), persis seperti orang menulis catatan belanja.
 *
 * Bentuk yang dimengerti:
 *
 *     Daun bawang | 1000 gram | 300 | 30
 *     Daun bawang 1000 gram 300 30 layu disimpan di suhu ruang
 *     Cabai rawit, beli 2000 gram, terbuang 180, harga 60
 *     - Daging ayam 5 kg, terbuang 250 gram, harga 38rb, karena kelamaan
 */

export type BahanWasteTerurai = {
  nama: string;
  jumlahBeli: number;
  satuan: string;
  hargaSatuan: number;
  jumlahTerbuang: number;
  penyebab: string;
};

export type HasilUraiDaftarWaste = {
  bahan: BahanWasteTerurai[];
  /** Baris yang tidak bisa dibaca, apa adanya, untuk ditunjukkan ke pemakai. */
  gagal: string[];
};

/** Judul kolom hasil salin-tempel dari spreadsheet — bukan data. */
const POLA_JUDUL_KOLOM = /^\s*(nama|bahan|item)\b.*\b(beli|terbuang|buang|harga)\b/i;

type Kolom = "jumlahBeli" | "jumlahTerbuang" | "hargaSatuan";

/** Kata kunci kolom, kalau pemakainya menuliskannya. */
const LABEL: { pola: RegExp; kolom: Kolom }[] = [
  { pola: /\b(beli|dibeli|belanja|stok|masuk)\b/i, kolom: "jumlahBeli" },
  { pola: /\b(terbuang|buang|dibuang|sisa|rusak|busuk|basi)\b/i, kolom: "jumlahTerbuang" },
  { pola: /\b(harga|per|@)\b/i, kolom: "hargaSatuan" },
];

/** Kata kunci yang menandai potongan berisi alasan, bukan angka. */
const POLA_SEBAB = /\b(sebab|penyebab|karena|alasan)\b/i;

/** Angka beserta satuan yang menempel padanya: "1000 gram", "2kg". */
const POLA_ANGKA_BERSATUAN = new RegExp(
  String.raw`(\d[\d.,]*)\s*(${SATUAN})\b`,
  "i",
);

type AngkaTerbaca = { nilai: number; kolom?: Kolom };

/**
 * Uraikan satu baris jadi satu bahan.
 *
 * Yang tidak punya nama, atau tidak punya satu angka pun, dikembalikan
 * sebagai gagal — tidak pernah diam-diam dianggap nol. Bahan terbuang yang
 * hilang dari daftar membuat total pemborosan terbaca lebih kecil dari
 * kenyataan, dan itu justru angka yang dicari orang di tab ini.
 */
export function uraiBarisWaste(baris: string): BahanWasteTerurai | null {
  const asli = baris.trim();
  if (!asli || POLA_JUDUL_KOLOM.test(asli)) return null;

  const teks = asli.replace(POLA_BULLET, "");
  const potongan = teks.split(pemisahUntuk(teks));

  const angka: AngkaTerbaca[] = [];
  const sisaNama: string[] = [];
  let satuan = "";
  let penyebab = "";

  for (const bagian of potongan) {
    // Potongan yang memang menyatakan alasan diambil utuh sebagai penyebab,
    // termasuk angkanya kalau ada ("busuk 2 hari sebelum dipakai").
    if (POLA_SEBAB.test(bagian)) {
      penyebab = bersihkanNama(bagian.replace(POLA_SEBAB, " "));
      continue;
    }

    // Satuan diambil dari angka pertama yang membawanya. Orang menulis
    // "1000 gram ... 300" — satuannya disebut sekali, berlaku untuk keduanya.
    if (!satuan) {
      const bersatuan = bagian.match(POLA_ANGKA_BERSATUAN);
      if (bersatuan?.[2]) satuan = bersatuan[2].toLowerCase();
    }

    const kolom = LABEL.find((label) => label.pola.test(bagian))?.kolom;
    let adaAngka = false;

    for (const cocok of bagian.matchAll(POLA_ANGKA)) {
      const nilai = bacaAngka(cocok[1] ?? "", cocok[2]);
      if (nilai === null) continue;
      angka.push({ nilai, kolom });
      adaAngka = true;
    }

    if (!adaAngka) sisaNama.push(bagian);
    else if (!kolom) sisaNama.push(bagian.replace(POLA_ANGKA, " "));
  }

  // Sisa kata setelah angka terakhir yang bukan nama dan bukan satuan adalah
  // alasan yang ditulis tanpa kata kunci: "… 300 layu di suhu ruang".
  const kata = sisaNama.join(" ").trim();
  const nama = bersihkanNama(
    kata.replace(new RegExp(String.raw`\s*\b(?:${SATUAN})\b\s*`, "gi"), " "),
  );

  if (!nama || angka.length === 0) return null;

  const hasil: BahanWasteTerurai = {
    nama,
    jumlahBeli: 0,
    satuan,
    hargaSatuan: 0,
    jumlahTerbuang: 0,
    penyebab,
  };

  const sudahDiisi = new Set<Kolom>();
  for (const satu of angka) {
    if (satu.kolom && !sudahDiisi.has(satu.kolom)) {
      hasil[satu.kolom] = satu.nilai;
      sudahDiisi.add(satu.kolom);
    }
  }

  // Angka tanpa label mengisi kolom yang masih kosong, urutan layar.
  const urutan: Kolom[] = ["jumlahBeli", "jumlahTerbuang", "hargaSatuan"];
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

  // Rupiah tidak punya sen (CLAUDE.md §6). Jumlah bahan boleh pecahan —
  // "1,5 kg" itu wajar — jadi hanya harganya yang dibulatkan.
  hasil.hargaSatuan = Math.round(hasil.hargaSatuan);

  return hasil;
}

/** Uraikan tempelan berisi banyak baris. */
export function uraiDaftarWaste(teks: string): HasilUraiDaftarWaste {
  const bahan: BahanWasteTerurai[] = [];
  const gagal: string[] = [];

  for (const baris of teks.split(/\r?\n/)) {
    const bersih = baris.trim();
    if (!bersih) continue;
    if (POLA_JUDUL_KOLOM.test(bersih)) continue;

    const hasil = uraiBarisWaste(bersih);
    if (hasil) bahan.push(hasil);
    else gagal.push(bersih);
  }

  return { bahan, gagal };
}
