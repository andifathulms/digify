import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  COOKIE_AKSES,
  COOKIE_SEGAR,
  UMUR_AKSES_DETIK,
  UMUR_SEGAR_DETIK,
  opsiCookie,
  urlBackend,
} from "@/lib/sesi";

/**
 * POST /api/auth/masuk
 *
 * Teruskan email + kata sandi ke Django, lalu simpan token yang dikembalikan
 * sebagai cookie httpOnly. Token tidak pernah dikirim balik ke browser sebagai
 * data — kalau dikirim, JavaScript bisa membacanya dan cookie httpOnly jadi
 * tidak ada gunanya.
 */
export async function POST(request: Request) {
  let respons: Response;
  try {
    respons = await fetch(urlBackend("/auth/masuk"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Koneksi ke server terputus. Periksa internet Anda, lalu coba lagi." },
      { status: 503 },
    );
  }

  const data = await respons.json().catch(() => ({}));

  if (!respons.ok) {
    return NextResponse.json(
      { error: data.error ?? "Belum berhasil. Coba ulangi sebentar lagi ya." },
      { status: respons.status },
    );
  }

  const toples = await cookies();
  toples.set(COOKIE_AKSES, data.access, { ...opsiCookie, maxAge: UMUR_AKSES_DETIK });
  toples.set(COOKIE_SEGAR, data.refresh, { ...opsiCookie, maxAge: UMUR_SEGAR_DETIK });

  return NextResponse.json({ profil: data.profil });
}
