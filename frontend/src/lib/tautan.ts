/** Tautan ke luar aplikasi. Satu tempat, supaya tidak tersebar di komponen. */

/**
 * Halaman pembayaran di affiliate.id.
 *
 * Diisi lewat env saat build. Kalau belum diisi — dan sampai kanal
 * pembayarannya diputuskan (PRD §8.1, masih terbuka) memang belum — tombol
 * ajakan mengarah ke bagian "Cara mulai" di halaman depan, yang menerangkan
 * urutannya dengan jujur.
 *
 * Yang TIDAK boleh terjadi: tombol utama mengarah ke /alat lalu pengunjung
 * dilempar ke form masuk yang tidak mungkin ia lewati. Itu keadaan sebelum
 * perubahan ini, dan halaman ini sekaligus menjanjikan "gratis dicoba,
 * tanpa mendaftar".
 *
 * NEXT_PUBLIC_ aman di sini: ini alamat halaman pembayaran publik, bukan
 * rahasia. Kunci API tetap tidak pernah keluar dari kontainer backend
 * (CLAUDE.md §3.1).
 */
export const URL_BELI = process.env.NEXT_PUBLIC_URL_BELI?.trim() || "#cara-mulai";

/** Benar kalau tautan belinya sudah diarahkan ke luar, bukan ke jangkar. */
export const BELI_KE_LUAR = URL_BELI.startsWith("http");
