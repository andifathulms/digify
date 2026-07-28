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
 */

const VERSI = "digify-v1";
const CACHE_STATIS = `${VERSI}-statis`;
const HALAMAN_OFFLINE = "/offline";

self.addEventListener("install", (peristiwa) => {
  peristiwa.waitUntil(
    caches.open(CACHE_STATIS).then((cache) => cache.addAll([HALAMAN_OFFLINE])),
  );
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
    peristiwa.respondWith(
      fetch(permintaan).catch(() => caches.match(HALAMAN_OFFLINE)),
    );
    return;
  }

  if (!bolehDisimpan(url)) return;

  // Berkas statis: cache dulu (nama berkasnya ber-hash, tidak mungkin basi).
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
