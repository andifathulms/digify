import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Uji service worker.
 *
 * Ditulis setelah kejadian 12 Agustus 2026: pengguna melihat layar putih
 * bertuliskan "Application error: a client-side exception has occurred" tepat
 * saat sebuah deploy berjalan.
 *
 * Sebabnya, service worker menyimpan DOKUMEN `/offline` hasil build ke cache.
 * Dokumen itu memuat rujukan ke potongan JavaScript milik build-nya sendiri.
 * Begitu deploy berikutnya mengganti nama potongan itu, dokumen lama di HP
 * pengguna menunjuk ke berkas yang sudah tidak ada — ChunkLoadError, dan
 * halaman yang justru dibuat untuk menangani kegagalan berubah jadi
 * penyebabnya.
 *
 * Kesalahan ini tidak akan pernah muncul di lingkungan pengembangan: ia butuh
 * DUA build berbeda plus jaringan yang gagal pada saat yang tepat. Jadi yang
 * dijaga di sini bukan perilakunya, melainkan bentuknya — halaman offline
 * tidak boleh bergantung pada satu berkas pun dari luar dirinya.
 */

const SW = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

function halamanOffline(): string {
  const cocok = SW.match(/const HALAMAN_OFFLINE = `([\s\S]*?)`;/);
  assert.ok(cocok, "HALAMAN_OFFLINE harus ada sebagai HTML utuh di dalam sw.js");
  return cocok[1] ?? "";
}

test("halaman offline tidak merujuk satu berkas luar pun", () => {
  // src= dan href= adalah cara sebuah dokumen menarik berkas lain. Halaman
  // offline harus utuh sendiri: apa pun yang ditariknya bisa hilang saat
  // deploy berikutnya, dan justru saat offline ia tidak bisa diambil ulang.
  const html = halamanOffline();
  assert.deepEqual(html.match(/(?:src|href)="[^"]+"/g) ?? [], []);
});

test("halaman offline tidak menyebut berkas build sama sekali", () => {
  const html = halamanOffline();
  assert.ok(!html.includes("_next"), "rujukan ke /_next/ akan basi tiap deploy");
  assert.ok(!html.includes(".woff"), "font ber-hash juga berganti nama tiap build");
});

test("service worker tidak mem-precache dokumen apa pun saat install", () => {
  // `cache.addAll([...])` pada tahap install adalah bentuk persis kesalahan
  // yang diperbaiki: ia membekukan dokumen satu build ke dalam HP pengguna.
  assert.ok(!/addAll\s*\(/.test(SW), "jangan precache dokumen di tahap install");
});

test("permintaan /api/ tidak pernah disentuh service worker", () => {
  // Di /api ada hasil hitungan, sesi, dan token. Tidak satu pun boleh
  // mendarat di cache HP yang bisa dipakai orang lain.
  assert.ok(SW.includes('url.pathname.startsWith("/api/")'));
});

test("navigasi memakai jaringan lebih dulu", () => {
  // Halaman bergantung pada cookie login. Menyajikan halaman tersimpan berarti
  // pengguna berikutnya di HP yang sama bisa melihat isi milik orang lain.
  assert.match(SW, /permintaan\.mode === "navigate"/);
  assert.match(SW, /fetch\(permintaan\)\.catch/);
});

test("halaman offline berbahasa Indonesia", () => {
  const html = halamanOffline();
  assert.ok(html.includes('lang="id"'));
  assert.ok(html.includes("Sedang tidak ada internet"));
});
