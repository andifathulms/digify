"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { TABS } from "@/lib/tabs";

/**
 * Kaki halaman alat: kembali ke daftar, alat sebelumnya, alat berikutnya.
 *
 * Alatnya berurutan — biaya menu dulu, baru harga jual, baru ranking. Setelah
 * membaca hasil sepanjang satu layar, titik terdekat untuk melanjutkan ada di
 * bawah, bukan di atas. Tanpa ini, satu-satunya jalan adalah menggulir balik
 * ke puncak lalu membuka daftar alat.
 */
export default function NavigasiLanjut() {
  const pathname = usePathname();
  const indeks = TABS.findIndex((tab) => pathname === `/alat/${tab.slug}`);
  if (indeks === -1) return null;

  const sebelum = TABS[indeks - 1];
  const sesudah = TABS[indeks + 1];

  return (
    <nav
      aria-label="Pindah alat"
      className="mt-8 border-t pt-5"
      style={{ borderColor: "var(--line)" }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
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
              <span aria-hidden>← </span>Sebelumnya
            </span>
            <span className="mt-0.5 text-sm font-semibold">{sebelum.judul}</span>
          </Link>
        ) : (
          <span className="hidden sm:block" />
        )}

        {sesudah ? (
          <Link
            href={`/alat/${sesudah.slug}`}
            className="flex flex-col justify-center px-4 py-3 sm:col-start-2 sm:text-right"
            style={{
              background: "var(--blue-wash)",
              border: "1px solid var(--blue-100)",
              borderRadius: "var(--radius)",
              minHeight: "var(--tap)",
            }}
          >
            <span className="label-kecil" style={{ color: "var(--blue-600)" }}>
              Lanjut<span aria-hidden> →</span>
            </span>
            <span className="mt-0.5 text-sm font-semibold" style={{ color: "var(--blue-800)" }}>
              {sesudah.judul}
            </span>
          </Link>
        ) : null}
      </div>

      <Link
        href="/alat"
        className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold"
        style={{ color: "var(--ink-dim)", minHeight: "var(--tap)" }}
      >
        Kembali ke semua alat
      </Link>
    </nav>
  );
}
