import { NextResponse } from "next/server";

import { teruskanKeBackend } from "@/lib/sesiServer";

/**
 * Penerus permintaan ke Django untuk seluruh endpoint /api/*.
 *
 * Kenapa semua diteruskan, bukan cuma /api/auth/* seperti rencana awal di
 * PRD §8.2: token disimpan sebagai cookie httpOnly milik origin FRONTEND.
 * Browser tidak bisa dan tidak boleh membacanya, jadi browser juga tidak bisa
 * memasang header Authorization sendiri saat memanggil Django langsung. Yang
 * bisa membacanya hanya sisi server Next.js — jadi di sinilah tempatnya.
 *
 * Efek sampingnya bagus: browser tidak pernah bicara langsung ke Django, dan
 * CORS tidak dibutuhkan sama sekali, di dev maupun di produksi.
 *
 * Route yang lebih spesifik (/api/auth/masuk, /api/auth/keluar) menang atas
 * catch-all ini, jadi keduanya tidak bertabrakan.
 */

const BATAS_WAKTU_MS = 120_000; // panggilan AI wajar 10–30 detik

async function teruskan(request: Request, jalur: string[], metode: "GET" | "POST") {
  const path = `/${jalur.join("/")}`;

  const kendali = new AbortController();
  const pewaktu = setTimeout(() => kendali.abort(), BATAS_WAKTU_MS);

  try {
    const respons = await teruskanKeBackend(path, {
      method: metode,
      body: metode === "POST" ? await request.text() : undefined,
      signal: kendali.signal,
    });

    const teks = await respons.text();
    return new NextResponse(teks, {
      status: respons.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "Prosesnya terlalu lama, coba lagi sebentar lagi." },
      { status: 504 },
    );
  } finally {
    clearTimeout(pewaktu);
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ jalur: string[] }> }) {
  return teruskan(request, (await params).jalur, "GET");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jalur: string[] }> },
) {
  return teruskan(request, (await params).jalur, "POST");
}
