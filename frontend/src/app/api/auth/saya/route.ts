import { NextResponse } from "next/server";

import { ambilProfil } from "@/lib/sesiServer";

/** GET /api/auth/saya — siapa yang sedang masuk. */
export async function GET() {
  const profil = await ambilProfil();
  if (!profil) {
    return NextResponse.json(
      { error: "Sesi Anda sudah berakhir. Silakan masuk lagi." },
      { status: 401 },
    );
  }
  return NextResponse.json({ profil });
}
