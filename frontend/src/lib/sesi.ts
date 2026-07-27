/**
 * Sesi: nama cookie dan cara meneruskan permintaan ke Django.
 *
 * Token TIDAK PERNAH disimpan di localStorage (PRD §8.2). localStorage bisa
 * dibaca skrip mana pun yang berhasil masuk ke halaman; cookie httpOnly tidak.
 * Konsekuensinya, yang boleh menyentuh token hanyalah Route Handler di
 * src/app/api/auth/ — satu-satunya tempat frontend punya "backend".
 */

export const COOKIE_AKSES = "digify_akses";
export const COOKIE_SEGAR = "digify_segar";

/** Umur cookie, disamakan dengan umur token di Django. */
export const UMUR_AKSES_DETIK = 15 * 60;
export const UMUR_SEGAR_DETIK = 30 * 24 * 60 * 60;

/** URL Django dari sisi server Next.js (di dalam jaringan Docker). */
export function urlBackend(path: string): string {
  const dasar = (process.env.BACKEND_INTERNAL_URL ?? "http://backend:8000").replace(/\/$/, "");
  return `${dasar}/api${path}`;
}

export const opsiCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // Secure hanya di produksi: di dev frontend berjalan lewat http://localhost
  // dan cookie Secure tidak akan pernah tersimpan di sana.
  secure: process.env.NODE_ENV === "production",
};
