/**
 * Membandingkan daftar bahan yang DITULIS dengan yang TERHITUNG.
 *
 * Masukan teks bebas adalah keputusan produk yang disengaja (PRD §5 Tab 1):
 * pemilik warung tidak dipaksa mengisi form per bahan. Harganya adalah
 * kegagalan yang senyap — baris yang tidak bisa diurai jumlahnya
 * ("kecap secukupnya", "garam sejumput") tidak menyumbang biaya apa pun,
 * biaya per porsi keluar TERLALU RENDAH, dan tidak ada satu pun tanda di
 * layar. Harga jual lalu ditetapkan dari angka yang kurang itu, dan
 * kekurangannya ikut di tiap porsi selama harga itu dipakai.
 *
 * Angka yang salah tapi terlihat yakin lebih berbahaya daripada tidak ada
 * angka sama sekali. Modul ini tugasnya membuat kekurangan itu terlihat.
 *
 * Dua tingkat keyakinan, dan bedanya penting:
 *
 *   `jumlahDitulis` vs `jumlahTerbaca` — PASTI. Sekadar menghitung baris
 *   berisi melawan panjang `ingredients_breakdown`. Ini yang boleh
 *   dinyatakan sebagai fakta.
 *
 *   `barisTakDikenali` — DUGAAN. Mencocokkan nama bahan hasil urai ke baris
 *   aslinya lewat pencocokan kata. Parser menormalkan nama, jadi pencocokan
 *   ini bisa meleset. Karena itu di layar ia ditulis sebagai "sepertinya",
 *   tidak pernah sebagai tuduhan.
 */

/** Baris yang jelas bukan bahan: kosong, atau sekadar penanda daftar. */
function barisBerisi(baris: string): boolean {
  const bersih = baris.trim().replace(/^[-*•\d.)\s]+/, "").trim();
  return bersih.length > 0;
}

/** Kata yang cukup panjang untuk dipakai mencocokkan. */
function kataPenting(teks: string): string[] {
  return teks
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((kata) => kata.length >= 4);
}

export type BacaanBahan = {
  jumlahDitulis: number;
  jumlahTerbaca: number;
  /** Benar kalau ada baris yang ditulis tapi tidak ikut terhitung. */
  adaYangTerlewat: boolean;
  /** Dugaan, bukan kepastian — lihat catatan di kepala berkas. */
  barisTakDikenali: string[];
};

export function periksaBahanTerbaca(
  teksBahan: string,
  namaTerbaca: readonly string[],
): BacaanBahan {
  const baris = teksBahan.split("\n").filter(barisBerisi);
  const jumlahDitulis = baris.length;
  const jumlahTerbaca = namaTerbaca.length;

  // Tiap nama hasil urai dipakai paling banyak sekali, supaya dua baris mirip
  // ("Cabai merah" dan "Cabai rawit") tidak dua-duanya diakui oleh satu hasil.
  const belumTerpakai = namaTerbaca.map((nama) => kataPenting(nama));
  const barisTakDikenali: string[] = [];

  for (const satuBaris of baris) {
    const kataBaris = kataPenting(satuBaris);
    const indeks = belumTerpakai.findIndex(
      (kataNama) =>
        kataNama.length > 0 && kataNama.some((kata) => kataBaris.includes(kata)),
    );

    if (indeks === -1) {
      barisTakDikenali.push(satuBaris.trim());
    } else {
      belumTerpakai.splice(indeks, 1);
    }
  }

  return {
    jumlahDitulis,
    jumlahTerbaca,
    adaYangTerlewat: jumlahTerbaca < jumlahDitulis,
    // Dugaan hanya ditampilkan kalau hitungan pastinya memang menunjukkan ada
    // yang terlewat. Tanpa syarat ini, pencocokan yang meleset bisa menuduh
    // baris yang sebenarnya terbaca dengan baik.
    barisTakDikenali: jumlahTerbaca < jumlahDitulis ? barisTakDikenali : [],
  };
}
