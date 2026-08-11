import { teruskanKeBackend } from "@/lib/sesiServer";

/**
 * Ambil data panel dari sisi server.
 *
 * Server Component, bukan fetch dari browser: token hidup sebagai cookie
 * httpOnly milik origin frontend, dan halaman panel tidak butuh interaktivitas
 * apa pun untuk menampilkan angkanya. Sekalian menghindari kedipan "memuat…"
 * pada tiap kotak angka.
 */
export async function ambilPanel<T>(path: string): Promise<T | null> {
  try {
    const respons = await teruskanKeBackend(path, { method: "GET" });
    if (!respons.ok) return null;
    return (await respons.json()) as T;
  } catch {
    return null;
  }
}
