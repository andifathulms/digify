import Link from "next/link";
import { redirect } from "next/navigation";

import Logo from "@/components/ui/Logo";
import TombolKeluar from "@/components/ui/TombolKeluar";
import { ambilProfil } from "@/lib/sesiServer";

/**
 * Rangka panel pengawasan.
 *
 * Penjagaan di sini BUKAN pengamanan — ia hanya mencegah orang yang tidak
 * berhak melihat halaman kosong yang seluruh isinya gagal dimuat. Pengamanan
 * sesungguhnya ada di backend: tiap endpoint /api/panel/* memeriksa izin
 * sendiri, karena siapa pun bisa memanggilnya langsung tanpa lewat halaman ini.
 *
 * Sengaja terpisah dari rangka /alat: yang ini dipakai orang dalam di laptop,
 * bukan pemilik warung di HP. Tidak ada lembar alat, tidak ada navigasi
 * sepuluh tab.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const profil = await ambilProfil();
  if (!profil) redirect("/masuk");
  if (!profil.boleh_panel) redirect("/alat");

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-30"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Logo ukuran={32} />
            <span className="flex flex-col">
              <span className="judul-kecil text-base leading-tight" style={{ color: "var(--blue-800)" }}>
                Panel Pengawasan
              </span>
              <span className="text-2xs" style={{ color: "var(--ink-soft)" }}>
                {profil.email}
              </span>
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-1">
            <Link href="/panel" className="label-isian rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold">
              Ringkasan
            </Link>
            <Link
              href="/panel/klien"
              className="label-isian rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold"
            >
              Pembeli
            </Link>
            <Link
              href="/alat"
              className="label-isian rounded-[var(--radius-sm)] px-3 py-2 text-sm"
              style={{ color: "var(--ink-dim)" }}
            >
              Ke aplikasi
            </Link>
            <TombolKeluar />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6">{children}</main>
    </div>
  );
}
