import assert from "node:assert/strict";
import { test } from "node:test";

import { bacaAngka, uraiBarisMenu, uraiDaftarMenu } from "./uraiDaftarMenu.ts";

/**
 * Uji pengurai daftar menu.
 *
 * Yang dijaga di sini bukan kerapian, melainkan uang. Kolom yang meleset satu
 * posisi membuat modal terbaca sebagai harga jual, dan menu yang rugi tampil
 * untung — tanpa satu pun pesan error. Karena itu bentuk-bentuk yang mungkin
 * ditempel pemilik warung diuji satu per satu, bukan diwakili satu contoh.
 */

test("bacaAngka mengerti pemisah ribuan Indonesia", () => {
  assert.equal(bacaAngka("8.000"), 8000);
  assert.equal(bacaAngka("8000"), 8000);
  assert.equal(bacaAngka("1.250.000"), 1250000);
});

test("bacaAngka membedakan pemisah ribuan dari desimal", () => {
  // Titik hanya pemisah ribuan kalau diikuti TEPAT tiga angka.
  assert.equal(bacaAngka("2,5"), 2.5);
  assert.equal(bacaAngka("2.5"), 2.5);
  assert.equal(bacaAngka("1.250,5"), 1250.5);
});

test("bacaAngka mengerti akhiran ribuan yang lazim ditulis", () => {
  assert.equal(bacaAngka("7", "rb"), 7000);
  assert.equal(bacaAngka("20", "k"), 20000);
  assert.equal(bacaAngka("5", "ribu"), 5000);
});

test("bacaAngka menolak yang bukan angka", () => {
  assert.equal(bacaAngka(""), null);
  assert.equal(bacaAngka("abc"), null);
});

test("membaca baris berpemisah garis tegak", () => {
  assert.deepEqual(uraiBarisMenu("Nasi Goreng Spesial | 8500 | 25000 | 70"), {
    name: "Nasi Goreng Spesial",
    cogs: 8500,
    price: 25000,
    weeklySales: 70,
  });
});

test("membaca baris berpemisah koma, angka bertitik ribuan", () => {
  assert.deepEqual(uraiBarisMenu("Nasi Goreng Spesial, 8.500, 25.000, 70"), {
    name: "Nasi Goreng Spesial",
    cogs: 8500,
    price: 25000,
    weeklySales: 70,
  });
});

test("membaca baris yang hanya dipisah spasi", () => {
  assert.deepEqual(uraiBarisMenu("Es Teh Manis 1500 5000 200"), {
    name: "Es Teh Manis",
    cogs: 1500,
    price: 5000,
    weeklySales: 200,
  });
});

test("membuang penanda daftar di awal baris", () => {
  assert.equal(uraiBarisMenu("- Es Teh Manis 1500 5000 200")?.name, "Es Teh Manis");
  assert.equal(uraiBarisMenu("1. Mie Goreng Jawa 7000 20000 45")?.name, "Mie Goreng Jawa");
  assert.equal(uraiBarisMenu("• Ayam Geprek 12000 22000 60")?.name, "Ayam Geprek");
});

test("membaca akhiran ribuan di dalam baris", () => {
  assert.deepEqual(uraiBarisMenu("Mie Goreng Jawa 7rb 20rb 45"), {
    name: "Mie Goreng Jawa",
    cogs: 7000,
    price: 20000,
    weeklySales: 45,
  });
});

test("membuang awalan Rp", () => {
  assert.deepEqual(uraiBarisMenu("Es Kopi Susu | Rp 6.000 | Rp 18.000 | 120"), {
    name: "Es Kopi Susu",
    cogs: 6000,
    price: 18000,
    weeklySales: 120,
  });
});

test("kata kunci kolom menang atas urutan", () => {
  assert.deepEqual(uraiBarisMenu("Ayam Geprek, harga 22000, modal 12000, terjual 60"), {
    name: "Ayam Geprek",
    cogs: 12000,
    price: 22000,
    weeklySales: 60,
  });
});

test("angka bersatuan tetap jadi bagian nama, bukan kolom", () => {
  // Tanpa penjagaan ini "500" terbaca sebagai modal dan seluruh baris
  // melenceng satu kolom — menu rugi akan tampil untung.
  assert.deepEqual(uraiBarisMenu("Es Teh 500ml 1500 5000 200"), {
    name: "Es Teh 500ml",
    cogs: 1500,
    price: 5000,
    weeklySales: 200,
  });
});

test("dua angka dibaca sebagai modal dan harga, terjual dibiarkan nol", () => {
  assert.deepEqual(uraiBarisMenu("Nasi Uduk 6000 15000"), {
    name: "Nasi Uduk",
    cogs: 6000,
    price: 15000,
    weeklySales: 0,
  });
});

test("rupiah dibulatkan penuh — produk ini tidak punya sen", () => {
  const hasil = uraiBarisMenu("Kue Cubit | 1500,6 | 3000 | 12");
  assert.equal(hasil?.cogs, 1501);
  assert.equal(hasil?.price, 3000);
});

test("arti koma diputuskan sekali untuk seluruh baris", () => {
  // Satu koma rapat = desimal. Dua atau lebih = pemisah kolom gaya CSV.
  // Batas ini ada karena angka desimal berturut-turut tidak pernah muncul di
  // daftar menu: ketiga kolomnya bilangan bulat.
  assert.equal(uraiBarisMenu("Kopi Tubruk | 1.250,5 | 8.000 | 90")?.cogs, 1251);
  assert.equal(uraiBarisMenu("Kopi Tubruk,1250,8000,90")?.weeklySales, 90);
});

test("koma pemisah tanpa spasi tetap terbaca sebagai empat kolom", () => {
  // Koma menanggung dua tugas dalam bahasa Indonesia: pemisah daftar dan
  // pemisah desimal. Yang ini pemisah daftar, ditulis rapat.
  assert.deepEqual(uraiBarisMenu("Nasi Uduk,6000,15000,30"), {
    name: "Nasi Uduk",
    cogs: 6000,
    price: 15000,
    weeklySales: 30,
  });
});

test("titik ribuan dan koma desimal boleh bercampur dalam satu baris", () => {
  assert.deepEqual(uraiBarisMenu("Kopi Tubruk | 1.250,5 | 8.000 | 90"), {
    name: "Kopi Tubruk",
    cogs: 1251,
    price: 8000,
    weeklySales: 90,
  });
});

test("baris tanpa angka sama sekali dianggap gagal", () => {
  assert.equal(uraiBarisMenu("Nasi Goreng Spesial"), null);
});

test("baris tanpa nama dianggap gagal", () => {
  assert.equal(uraiBarisMenu("8500 25000 70"), null);
});

test("judul kolom hasil salin-tempel dari spreadsheet dilewati", () => {
  assert.equal(uraiBarisMenu("Nama Menu | Modal | Harga | Terjual"), null);
});

test("menguraikan tempelan banyak baris sekaligus", () => {
  const hasil = uraiDaftarMenu(
    [
      "Nasi Goreng Spesial | 8500 | 25000 | 70",
      "",
      "- Es Teh Manis 1500 5000 200",
      "Mie Goreng Jawa, 7rb, 20rb, 45",
    ].join("\n"),
  );

  assert.equal(hasil.menu.length, 3);
  assert.equal(hasil.gagal.length, 0);
  assert.deepEqual(
    hasil.menu.map((baris) => baris.name),
    ["Nasi Goreng Spesial", "Es Teh Manis", "Mie Goreng Jawa"],
  );
});

test("baris yang gagal dikembalikan apa adanya, tidak diam-diam jadi nol", () => {
  // Aturan yang sama dengan parser_bahan.py: baris yang tidak terbaca tidak
  // boleh hilang tanpa jejak. Pemiliknya harus bisa melihat mana yang belum
  // masuk.
  const hasil = uraiDaftarMenu(
    ["Nasi Goreng Spesial | 8500 | 25000 | 70", "menu yang lupa saya isi angkanya"].join("\n"),
  );

  assert.equal(hasil.menu.length, 1);
  assert.deepEqual(hasil.gagal, ["menu yang lupa saya isi angkanya"]);
});

test("baris kosong tidak dihitung sebagai gagal", () => {
  const hasil = uraiDaftarMenu("\n\n  \n");
  assert.equal(hasil.menu.length, 0);
  assert.equal(hasil.gagal.length, 0);
});
