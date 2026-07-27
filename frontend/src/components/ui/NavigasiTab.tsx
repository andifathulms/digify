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
      className="no-scrollbar -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0"
      style={{ scrollbarWidth: "none" }}
    >
      <ul className="flex w-max gap-2 pb-1">
        {TABS.map((tab) => {
          const href = `/alat/${tab.slug}`;
          const aktif = pathname === href;
          return (
            <li key={tab.slug}>
              <Link
                href={href}
                ref={aktif ? aktifRef : undefined}
                aria-current={aktif ? "page" : undefined}
                className="inline-flex items-center gap-2 rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  minHeight: "var(--tap)",
                  background: aktif ? "var(--blue-deep)" : "var(--surface)",
                  color: aktif ? "#FFFFFF" : "var(--ink-dim)",
                  border: `1px solid ${aktif ? "var(--blue-deep)" : "var(--line)"}`,
                }}
              >
                <span
                  className="tabular text-xs"
                  style={{ color: aktif ? "rgb(255 255 255 / 70%)" : "var(--blue)" }}
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
