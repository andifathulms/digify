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
 * POST /api/auth/ganti-kata-sandi
 *
 * Django menerbitkan token baru setelah kata sandi berganti, jadi cookie ikut
 * diperbarui di sini — kalau tidak, user langsung terlempar keluar tepat
 * setelah berhasil mengganti kata sandinya.
 */
export async function POST(request: Request) {
  const toples = await cookies();
  const akses = toples.get(COOKIE_AKSES)?.value;

  if (!akses) {
    return NextResponse.json(
      { error: "Sesi Anda sudah berakhir. Silakan masuk lagi." },
      { status: 401 },
    );
  }

  const respons = await fetch(urlBackend("/auth/ganti-kata-sandi"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${akses}` },
    body: await request.text(),
    cache: "no-store",
  });

  const data = await respons.json().catch(() => ({}));

  if (!respons.ok) {
    return NextResponse.json(
      { error: data.error ?? "Belum berhasil. Coba ulangi sebentar lagi ya." },
      { status: respons.status },
    );
  }

  toples.set(COOKIE_AKSES, data.access, { ...opsiCookie, maxAge: UMUR_AKSES_DETIK });
  toples.set(COOKIE_SEGAR, data.refresh, { ...opsiCookie, maxAge: UMUR_SEGAR_DETIK });

  return NextResponse.json({ profil: data.profil });
}
