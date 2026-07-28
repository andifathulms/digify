"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TABS } from "@/lib/tabs";

/**
 * Tautan "alat sebelumnya / alat berikutnya" di kaki tiap halaman alat.
 *
 * Alatnya berurutan — biaya menu dulu, baru harga jual, baru ranking. Tapi
 * satu-satunya cara berpindah sebelumnya adalah menggulir kembali ke atas
 * dan mencari pil yang benar di baris tab. Setelah membaca hasil sepanjang
 * satu layar, titik terdekat untuk melanjutkan ada di bawah, bukan di atas.
 */
export default function NavigasiLanjut() {
  const pathname = usePathname();
  const indeks = TABS.findIndex((tab) => pathname === `/alat/${tab.slug}`);
  if (indeks === -1) return null;

  const sebelum = indeks > 0 ? TABS[indeks - 1] : null;
  const sesudah = indeks < TABS.length - 1 ? TABS[indeks + 1] : null;
  if (!sebelum && !sesudah) return null;

  return (
    <nav
      aria-label="Pindah alat"
      className="mt-2 grid gap-3 border-t pt-5 sm:grid-cols-2"
      style={{ borderColor: "var(--line)" }}
    >
      {sebelum ? (
        <Link
          href={`/alat/${sebelum.slug}`}
          className="flex flex-col justify-center px-4 py-3"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            minHeight: "var(--tap)",
          }}
        >
          <span className="label-kecil" style={{ color: "var(--ink-soft)" }}>
            ← Sebelumnya
          </span>
          <span className="mt-0.5 text-sm font-semibold">{sebelum.judul}</span>
        </Link>
      ) : (
        <span />
      )}

      {sesudah ? (
        <Link
          href={`/alat/${sesudah.slug}`}
          className="flex flex-col justify-center px-4 py-3 text-right sm:col-start-2"
          style={{
            background: "var(--blue-wash)",
            border: "1px solid var(--blue-100)",
            borderRadius: "var(--radius)",
            minHeight: "var(--tap)",
          }}
        >
          <span className="label-kecil" style={{ color: "var(--blue-600)" }}>
            Lanjut →
          </span>
          <span className="mt-0.5 text-sm font-semibold" style={{ color: "var(--blue-800)" }}>
            {sesudah.judul}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
