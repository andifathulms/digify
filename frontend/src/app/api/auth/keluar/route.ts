import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COOKIE_AKSES, COOKIE_SEGAR } from "@/lib/sesi";

/** POST /api/auth/keluar — hapus cookie sesi. */
export async function POST() {
  const toples = await cookies();
  toples.delete(COOKIE_AKSES);
  toples.delete(COOKIE_SEGAR);
  return NextResponse.json({ status: "ok" });
}
