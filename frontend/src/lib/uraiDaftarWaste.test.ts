import assert from "node:assert/strict";
import { test } from "node:test";

import { uraiBarisWaste, uraiDaftarWaste } from "./uraiDaftarWaste.ts";

/**
 * Uji pengurai daftar bahan terbuang.
 *
 * Yang dijaga sama dengan pengurai daftar menu: kolom yang meleset satu posisi
 * tidak memunculkan pesan galat apa pun, ia cuma mengubah angka pemborosan —
 * dan angka itulah satu-satunya alasan orang membuka tab ini.
 */

test("membaca baris berpemisah garis tegak, satuan menempel di angka", () => {
  assert.deepEqual(uraiBarisWaste("Daun bawang | 1000 gram | 300 | 30"), {
    nama: "Daun bawang",
    jumlahBeli: 1000,
    satuan: "gram",
    hargaSatuan: 30,
    jumlahTerbuang: 300,
    penyebab: "",
  });
});

test("membaca baris yang hanya dipisah spasi", () => {
  const hasil = uraiBarisWaste("Cabai rawit 2000 gram 180 60");
  assert.equal(hasil?.nama, "Cabai rawit");
  assert.equal(hasil?.jumlahBeli, 2000);
  assert.equal(hasil?.jumlahTerbuang, 180);
  assert.equal(hasil?.hargaSatuan, 60);
  assert.equal(hasil?.satuan, "gram");
});

test("kata kunci kolom menang atas urutan", () => {
  const hasil = uraiBarisWaste("Daging ayam, harga 38, terbuang 250, beli 5000");
  assert.equal(hasil?.jumlahBeli, 5000);
  assert.equal(hasil?.jumlahTerbuang, 250);
  assert.equal(hasil?.hargaSatuan, 38);
});

test("membuang penanda daftar di awal baris", () => {
  assert.equal(uraiBarisWaste("- Daun bawang 1000 gram 300 30")?.nama, "Daun bawang");
  assert.equal(uraiBarisWaste("2. Cabai rawit 2000 gram 180 60")?.nama, "Cabai rawit");
});

test("membaca akhiran ribuan", () => {
  assert.equal(uraiBarisWaste("Daging ayam | 5 kg | 250 | 38rb")?.hargaSatuan, 38000);
});

test("satuan diambil dari angka pertama yang membawanya", () => {
  const hasil = uraiBarisWaste("Daging ayam 5 kg 250 38000");
  assert.equal(hasil?.satuan, "kg");
  assert.equal(hasil?.jumlahBeli, 5);
});

test("satuan boleh tidak ditulis sama sekali", () => {
  const hasil = uraiBarisWaste("Telur | 30 | 4 | 2500");
  assert.equal(hasil?.satuan, "");
  assert.equal(hasil?.jumlahBeli, 30);
  assert.equal(hasil?.jumlahTerbuang, 4);
});

test("alasan berkata kunci diambil sebagai penyebab", () => {
  const hasil = uraiBarisWaste("Daun bawang | 1000 gram | 300 | 30 | karena layu di suhu ruang");
  assert.equal(hasil?.penyebab, "layu di suhu ruang");
  assert.equal(hasil?.jumlahTerbuang, 300);
});

test("jumlah bahan boleh pecahan, harga tetap dibulatkan", () => {
  // "1,5 kg" itu wajar. Rupiah yang tidak punya sen (CLAUDE.md §6).
  const hasil = uraiBarisWaste("Bawang merah | 1,5 kg | 0,25 | 40000,6");
  assert.equal(hasil?.jumlahBeli, 1.5);
  assert.equal(hasil?.jumlahTerbuang, 0.25);
  assert.equal(hasil?.hargaSatuan, 40001);
});

test("baris tanpa angka sama sekali dianggap gagal", () => {
  assert.equal(uraiBarisWaste("Daun bawang"), null);
});

test("baris tanpa nama dianggap gagal", () => {
  assert.equal(uraiBarisWaste("1000 300 30"), null);
});

test("judul kolom hasil salin-tempel dari spreadsheet dilewati", () => {
  assert.equal(uraiBarisWaste("Nama bahan | Jumlah beli | Terbuang | Harga"), null);
});

test("menguraikan tempelan banyak baris sekaligus", () => {
  const hasil = uraiDaftarWaste(
    [
      "Daun bawang | 1000 gram | 300 | 30",
      "",
      "- Daging ayam 5000 gram 250 38",
      "Cabai rawit, beli 2000, terbuang 180, harga 60",
    ].join("\n"),
  );

  assert.equal(hasil.bahan.length, 3);
  assert.equal(hasil.gagal.length, 0);
  assert.deepEqual(
    hasil.bahan.map((baris) => baris.nama),
    ["Daun bawang", "Daging ayam", "Cabai rawit"],
  );
});

test("baris yang gagal dikembalikan apa adanya, tidak diam-diam jadi nol", () => {
  // Bahan yang hilang dari daftar membuat total pemborosan terbaca lebih
  // kecil dari kenyataan — justru angka yang dicari orang di tab ini.
  const hasil = uraiDaftarWaste(
    ["Daun bawang | 1000 gram | 300 | 30", "bawang putih lupa saya timbang"].join("\n"),
  );

  assert.equal(hasil.bahan.length, 1);
  assert.deepEqual(hasil.gagal, ["bawang putih lupa saya timbang"]);
});
