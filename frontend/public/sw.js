/*
 * Service worker Digify Laris.
 *
 * Sengaja sekecil dan sekonservatif mungkin. Service worker yang rakus
 * menyimpan HTML adalah cara termudah membuat pengguna terjebak melihat versi
 * lama aplikasi berhari-hari — dan pada produk yang isinya angka uang, itu
 * jauh lebih buruk daripada sekadar lambat.
 *
 * Aturannya tiga:
 *
 * 1. `/api/*` TIDAK PERNAH disentuh. Di situ ada hasil hitungan, sesi, dan
 *    token. Tidak ada satu pun yang boleh mendarat di cache.
 *
 * 2. Halaman (navigasi) TIDAK PERNAH disimpan. Isinya bergantung pada cookie
 *    login — halaman tersimpan bisa terlihat oleh orang berikutnya yang
 *    memakai HP yang sama, dan pasti basi. Kalau jaringan mati, yang muncul
 *    halaman "sedang offline", bukan halaman lama yang menyesatkan.
 *
 * 3. Yang disimpan hanya berkas statis ber-hash: /_next/static/*, font, dan
 *    ikon. Nama berkasnya berubah tiap kali isinya berubah, jadi tidak mungkin
 *    basi. Inilah yang membuat aplikasi terbuka seketika saat dibuka lagi,
 *    dan tetap terpasang rapi meski sinyal sedang buruk.
 *
 * ── Kenapa halaman offline-nya ditulis LANGSUNG di berkas ini ──────────────
 *
 * Diperbaiki 12 Agustus 2026, setelah pengguna melihat layar putih bertuliskan
 * "Application error: a client-side exception has occurred".
 *
 * Sebelumnya berkas ini menyimpan DOKUMEN `/offline` hasil build ke dalam
 * cache. Dokumen itu memuat rujukan ke potongan JavaScript milik build-nya
 * sendiri, mis. `/_next/static/chunks/app/offline/page-b85d0ffbf175b2ae.js`.
 * Begitu ada deploy baru, nama potongan itu berubah dan yang lama hilang dari
 * server — tapi dokumen lamanya masih tersimpan rapi di HP pengguna.
 *
 * Yang membuatnya tidak pernah sembuh sendiri: `VERSI` di bawah ditulis tetap,
 * dan isi berkas ini tidak berubah antar build. Peramban memutuskan memperbarui
 * service worker dengan membandingkan ISI berkasnya — kalau isinya sama persis,
 * ia tidak pernah dipasang ulang, dan cache berisi dokumen basi itu hidup
 * selamanya.
 *
 * Jadi rantainya: deploy berjalan → server sesaat tidak terjangkau → navigasi
 * gagal → service worker menyajikan dokumen `/offline` yang basi → dokumen itu
 * meminta potongan JS yang sudah tidak ada → ChunkLoadError → React gagal
 * hidup → layar galat. Halaman yang justru dibuat untuk menangani kegagalan
 * dengan anggun berubah menjadi penyebab kegagalannya.
 *
 * Sekarang halaman offline-nya berupa HTML utuh di dalam berkas ini: tidak
 * memuat satu pun berkas luar, tidak punya potongan JS, tidak terikat build
 * mana pun. Ia tidak bisa basi karena tidak ada yang bisa hilang dari
 * belakangnya.
 */

// Dinaikkan ke v2 dengan sengaja: ini yang membuang cache lama berisi dokumen
// `/offline` yang sudah beracun di HP pengguna yang terlanjur kena.
const VERSI = "digify-v2";
const CACHE_STATIS = `${VERSI}-statis`;

/* Halaman offline, utuh dan mandiri. Font bawaan sistem, warna ditulis
 * langsung — berkas font dan lembar gaya aplikasi sama-sama ber-hash per
 * build, dan merujuknya dari sini akan mengulangi persis kesalahan yang
 * sedang diperbaiki. */
const HALAMAN_OFFLINE = `<!doctype html>
<html lang="id">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sedang tidak ada internet — Digify Laris</title>
<style>
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center;
    justify-content: center; padding: 24px; background: #F7F9FC; color: #132238;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6; text-align: center;
  }
  .kotak { max-width: 22rem; }
  h1 { font-size: 1.25rem; margin: 0 0 8px; }
  p { margin: 0 0 20px; color: #5E6C82; font-size: 0.95rem; }
  button {
    font: inherit; font-weight: 600; color: #fff; background: #F2790C;
    border: 0; border-radius: 10px; padding: 14px 28px; min-height: 48px;
    cursor: pointer;
  }
</style>
<div class="kotak">
  <h1>Sedang tidak ada internet</h1>
  <p>Aplikasinya tetap terpasang di HP Anda. Begitu sinyal kembali, tekan tombol di bawah.</p>
  <button onclick="location.reload()">Coba lagi</button>
</div>
`;

function responsOffline() {
  return new Response(HALAMAN_OFFLINE, {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

self.addEventListener("install", () => {
  // Tidak ada yang di-precache. Satu-satunya hal yang dulu disimpan di sini
  // justru yang merusak; lihat catatan di atas.
  self.skipWaiting();
});

self.addEventListener("activate", (peristiwa) => {
  peristiwa.waitUntil(
    caches
      .keys()
      .then((nama) =>
        Promise.all(nama.filter((n) => !n.startsWith(VERSI)).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

function bolehDisimpan(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/ikon/") ||
    url.pathname.endsWith(".woff2")
  );
}

self.addEventListener("fetch", (peristiwa) => {
  const permintaan = peristiwa.request;
  if (permintaan.method !== "GET") return;

  const url = new URL(permintaan.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Navigasi: jaringan dulu, dan kalau gagal tampilkan halaman offline.
  if (permintaan.mode === "navigate") {
    peristiwa.respondWith(fetch(permintaan).catch(() => responsOffline()));
    return;
  }

  if (!bolehDisimpan(url)) return;

  // Berkas statis: cache dulu (nama berkasnya ber-hash, tidak mungkin basi).
  //
  // Yang tidak ada di cache DAN gagal diambil dibiarkan gagal apa adanya,
  // bukan dibalas halaman offline: mengembalikan HTML untuk permintaan .js
  // membuat peramban tersedak pada berkas yang isinya bukan yang ia minta,
  // dan pesan galatnya jadi menyesatkan.
  peristiwa.respondWith(
    caches.match(permintaan).then((tersimpan) => {
      if (tersimpan) return tersimpan;
      return fetch(permintaan).then((respons) => {
        if (respons.ok) {
          const salinan = respons.clone();
          caches.open(CACHE_STATIS).then((cache) => cache.put(permintaan, salinan));
        }
        return respons;
      });
    }),
  );
});
