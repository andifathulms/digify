"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import IkonAlat from "@/components/ui/IkonAlat";
import { NAMA_KELOMPOK, TABS } from "@/lib/tabs";

/**
 * Daftar sepuluh alat, dikelompokkan per mesin.
 *
 * Satu komponen dipakai dua tempat: sidebar tetap di layar lebar, dan lembar
 * penuh yang muncul dari tombol "Semua alat" di HP. Keduanya harus persis
 * sama isinya — kalau urutan atau namanya berbeda antara HP dan laptop, user
 * yang berpindah perangkat harus belajar ulang letak alatnya.
 */
export default function DaftarAlat({ onPilih }: { onPilih?: () => void }) {
  const pathname = usePathname();

  const kelompok = [
    {
      nama: NAMA_KELOMPOK.Profit,
      ringkas: "Merapikan untung",
      warna: "var(--blue-600)",
      daftar: TABS.filter((tab) => tab.kelompok === "Profit"),
    },
    {
      nama: NAMA_KELOMPOK.Growth,
      ringkas: "Menambah pembeli",
      warna: "var(--orange-600)",
      daftar: TABS.filter((tab) => tab.kelompok === "Growth"),
    },
  ];

  const diBeranda = pathname === "/alat";

  return (
    <nav aria-label="Daftar alat" className="flex flex-col gap-5">
      <Link
        href="/alat"
        onClick={onPilih}
        aria-current={diBeranda ? "page" : undefined}
        className="flex items-center gap-3 px-3 text-sm font-semibold"
        style={{
          minHeight: "var(--tap)",
          borderRadius: "var(--radius-sm)",
          background: diBeranda ? "var(--blue-wash)" : "transparent",
          color: diBeranda ? "var(--blue-800)" : "var(--ink-dim)",
        }}
      >
        <svg
          aria-hidden
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />
        </svg>
        Semua alat
      </Link>

      {kelompok.map((mesin) => (
        <div key={mesin.nama}>
          <p className="label-kecil px-3 pb-2" style={{ color: "var(--ink-soft)" }}>
            {mesin.nama}
          </p>

          <ul className="flex flex-col gap-0.5">
            {mesin.daftar.map((tab) => {
              const href = `/alat/${tab.slug}`;
              const aktif = pathname === href;

              return (
                <li key={tab.slug}>
                  <Link
                    href={href}
                    onClick={onPilih}
                    aria-current={aktif ? "page" : undefined}
                    className="flex items-center gap-3 px-3 text-sm font-medium"
                    style={{
                      minHeight: "var(--tap)",
                      borderRadius: "var(--radius-sm)",
                      background: aktif ? "var(--grad-panel)" : "transparent",
                      color: aktif ? "var(--on-dark)" : "var(--ink)",
                      boxShadow: aktif ? "var(--shadow-sm)" : "none",
                      transition: "background var(--dur) var(--ease)",
                    }}
                  >
                    <span style={{ color: aktif ? "var(--on-dark)" : mesin.warna }}>
                      <IkonAlat slug={tab.slug} />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{tab.judul}</span>
                    <span
                      aria-hidden
                      className="tabular text-xs"
                      style={{ color: aktif ? "var(--on-dark-dim)" : "var(--ink-soft)" }}
                    >
                      {tab.nomor}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
