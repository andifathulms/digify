"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { TABS } from "@/lib/tabs";

/**
 * Baris tab yang bisa digeser horizontal.
 *
 * Sepuluh tab tidak muat di layar 360px. Alih-alih membungkusnya jadi
 * beberapa baris yang memakan setengah layar, tab digeser — dan tab yang
 * sedang aktif digulirkan sendiri ke tengah supaya user tidak pernah
 * kehilangan posisi setelah pindah halaman.
 *
 * Dua penambahan dibanding versi pertama:
 * 1. Penanda kelompok ("PROFIT" sebelum tab 1, "GROWTH" sebelum tab 7).
 *    Sepuluh pil serupa tanpa pemisah terbaca sebagai satu daftar acak;
 *    padahal tab 1–6 menghitung uang dan tab 7–10 membuat konten. Batas itu
 *    perlu terlihat, karena menentukan alat mana yang sedang dicari user.
 * 2. Tepi memudar (kelas `.tepi-memudar`) sebagai isyarat masih ada tab lain
 *    di luar layar. Tanpa itu tab 6 ke atas praktis tidak ditemukan di HP.
 */
export default function NavigasiTab() {
  const pathname = usePathname();
  const aktifRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    aktifRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <nav
      aria-label="Daftar alat"
      className="no-scrollbar tepi-memudar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0"
      style={{ scrollbarWidth: "none" }}
    >
      <ul className="flex w-max items-center gap-2 py-1">
        {TABS.map((tab, indeks) => {
          const href = `/alat/${tab.slug}`;
          const aktif = pathname === href;
          const kelompokBaru = TABS[indeks - 1]?.kelompok !== tab.kelompok;

          return (
            <li key={tab.slug} className="flex items-center gap-2">
              {kelompokBaru ? (
                <span
                  aria-hidden
                  className="label-kecil px-1 whitespace-nowrap"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {tab.kelompok}
                </span>
              ) : null}

              <Link
                href={href}
                ref={aktif ? aktifRef : undefined}
                aria-current={aktif ? "page" : undefined}
                className="inline-flex items-center gap-2 pr-4 pl-2 text-sm font-semibold whitespace-nowrap"
                style={{
                  minHeight: "var(--tap)",
                  borderRadius: "var(--radius-pill)",
                  background: aktif ? "var(--grad-panel)" : "var(--surface)",
                  color: aktif ? "var(--on-dark)" : "var(--ink-dim)",
                  border: `1px solid ${aktif ? "var(--blue-800)" : "var(--line)"}`,
                  boxShadow: aktif ? "var(--shadow)" : "var(--shadow-xs)",
                  transition:
                    "background var(--dur) var(--ease), color var(--dur) var(--ease), border-color var(--dur) var(--ease)",
                }}
              >
                <span
                  aria-hidden
                  className="tabular flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                  style={{
                    background: aktif ? "rgb(255 255 255 / 18%)" : "var(--blue-50)",
                    color: aktif ? "var(--on-dark)" : "var(--blue-600)",
                  }}
                >
                  {tab.nomor}
                </span>
                {tab.judul}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
