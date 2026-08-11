import assert from "node:assert/strict";
import { test } from "node:test";

import { formatAngka, formatPersen, formatRupiah, parseAngka } from "./format.ts";

/**
 * Uji helper angka — sekaligus uji pertama yang membuktikan gerbang uji
 * frontend benar-benar jalan.
 *
 * Kenapa justru berkas ini yang diuji lebih dulu: seluruh angka rupiah di
 * sepuluh alat lewat sini. Kalau pemisah ribuannya salah, tidak ada yang
 * error — angkanya cuma terbaca beda, dan pemilik warung menetapkan harga
 * dari angka yang salah itu.
 *
 * Yang dijaga khusus: pemisah ribuan Indonesia adalah TITIK dan desimalnya
 * KOMA, kebalikan dari bawaan Inggris. Itu bergantung pada data locale ICU
 * yang ikut di dalam Node. Kalau suatu saat image-nya diganti dengan yang
 * ICU-nya dipangkas, "Rp 12.500" diam-diam berubah jadi "Rp 12,500" di
 * seluruh aplikasi — dan uji ini yang menangkapnya.
 */

test("formatRupiah memakai titik sebagai pemisah ribuan", () => {
  assert.equal(formatRupiah(12500), "Rp 12.500");
  assert.equal(formatRupiah(1250000), "Rp 1.250.000");
  assert.equal(formatRupiah(0), "Rp 0");
});

test("formatRupiah membulatkan ke rupiah penuh — produk ini tidak punya sen", () => {
  assert.equal(formatRupiah(12500.4), "Rp 12.500");
  assert.equal(formatRupiah(12500.5), "Rp 12.501");
});

test("formatRupiah tidak pernah menampilkan NaN atau kosong ke pemakai", () => {
  assert.equal(formatRupiah(null), "Rp 0");
  assert.equal(formatRupiah(undefined), "Rp 0");
  assert.equal(formatRupiah(Number.NaN), "Rp 0");
});

test("formatAngka sama tanpa awalan Rp", () => {
  assert.equal(formatAngka(12500), "12.500");
  assert.equal(formatAngka(null), "0");
});

test("formatPersen memakai koma desimal", () => {
  assert.equal(formatPersen(64.5), "64,5%");
  assert.equal(formatPersen(64), "64%");
  assert.equal(formatPersen(null), "0%");
});

test("parseAngka membaca kembali angka yang sudah diformat", () => {
  assert.equal(parseAngka("Rp 12.500"), 12500);
  assert.equal(parseAngka("12500"), 12500);
  assert.equal(parseAngka(""), 0);
  assert.equal(parseAngka("bukan angka"), 0);
});
