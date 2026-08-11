import { cookies } from "next/headers";

import {
  COOKIE_AKSES,
  COOKIE_SEGAR,
  UMUR_AKSES_DETIK,
  opsiCookie,
  urlBackend,
} from "@/lib/sesi";

/**
 * Pembantu sesi di sisi server. HANYA boleh dipakai dari Server Component atau
 * Route Handler — file ini menyentuh token, dan token tidak boleh sampai ke
 * browser.
 */

export type Profil = {
  email: string;
  full_name: string;
  whatsapp: string;
  must_change_password: boolean;
  /** Boleh membuka panel pengawasan. Dipakai untuk memutuskan menampilkan
   *  menunya — penjagaan sesungguhnya ada di setiap endpoint panel. */
  boleh_panel: boolean;
};

/** Tukar refresh token jadi access token baru, lalu simpan ulang cookienya. */
async function segarkanAkses(): Promise<string | null> {
  const toples = await cookies();
  const segar = toples.get(COOKIE_SEGAR)?.value;
  if (!segar) return null;

  const respons = await fetch(urlBackend("/auth/segarkan"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: segar }),
    cache: "no-store",
  });

  if (!respons.ok) return null;

  const data = await respons.json().catch(() => ({}));
  if (!data.access) return null;

  toples.set(COOKIE_AKSES, data.access, { ...opsiCookie, maxAge: UMUR_AKSES_DETIK });
  return data.access as string;
}

/**
 * Teruskan satu permintaan ke Django dengan token dari cookie.
 *
 * Access token hanya hidup 15 menit. Tanpa penyegaran otomatis di sini, user
 * yang mengisi form panjang akan ditendang keluar tepat saat menekan tombol
 * hitung — dan data isiannya hilang.
 */
export async function teruskanKeBackend(
  path: string,
  init: RequestInit,
): Promise<Response> {
  const toples = await cookies();
  let akses = toples.get(COOKIE_AKSES)?.value;

  // Access sudah kedaluwarsa tapi refresh masih ada: perbarui dulu, jangan
  // langsung menyerah.
  if (!akses) {
    akses = (await segarkanAkses()) ?? undefined;
  }
  if (!akses) {
    return Response.json(
      { error: "Sesi Anda sudah berakhir. Silakan masuk lagi." },
      { status: 401 },
    );
  }

  const kirim = (token: string) =>
    fetch(urlBackend(path), {
      ...init,
      headers: {
        ...init.headers,
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

  let respons = await kirim(akses);

  if (respons.status === 401) {
    const aksesBaru = await segarkanAkses();
    if (!aksesBaru) {
      return Response.json(
        { error: "Sesi Anda sudah berakhir. Silakan masuk lagi." },
        { status: 401 },
      );
    }
    respons = await kirim(aksesBaru);
  }

  return respons;
}

export async function ambilProfil(): Promise<Profil | null> {
  try {
    const respons = await teruskanKeBackend("/auth/saya", { method: "GET" });
    if (!respons.ok) return null;
    const data = await respons.json();
    return (data as Profil) ?? null;
  } catch {
    return null;
  }
}
