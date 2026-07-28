import Link from "next/link";
import { redirect } from "next/navigation";

import DaftarAlat from "@/components/ui/DaftarAlat";
import LembarAlat from "@/components/ui/LembarAlat";
import Logo from "@/components/ui/Logo";
import NavigasiLanjut from "@/components/ui/NavigasiLanjut";
import StatusServer from "@/components/ui/StatusServer";
import TombolKeluar from "@/components/ui/TombolKeluar";
import { ambilProfil } from "@/lib/sesiServer";

/**
 * Rangka aplikasi — dua bentuk, satu isi.
 *
 * Layar lebar: sidebar tetap berisi kesepuluh alat. Tidak ada yang perlu
 * digeser atau dibuka; user selalu tahu ada di mana dan apa lagi yang tersedia.
 *
 * HP: sidebar-nya jadi lembar yang dipanggil lewat tombol "Semua alat" di
 * bilah atas. Isinya sama persis, hanya cara memanggilnya yang berbeda —
 * supaya orang yang berpindah dari HP ke laptop tidak perlu belajar ulang.
 */
export default async function AlatLayout({ children }: { children: React.ReactNode }) {
  // Penjagaan sesungguhnya ada di backend — setiap endpoint AI menolak request
  // tanpa token. Pemeriksaan di sini semata supaya user tidak melihat sepuluh
  // form yang tombolnya pasti gagal saat ditekan.
  const profil = await ambilProfil();
  if (!profil) redirect("/masuk");
  if (profil.must_change_password) redirect("/masuk/ganti-kata-sandi");

  return (
    <div className="lg:flex">
      {/* ── Sidebar (layar lebar) ─────────────────────────────────────── */}
      <aside
        className="sticky top-0 hidden h-dvh w-[268px] shrink-0 flex-col lg:flex"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--line)" }}
      >
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
          <Logo ukuran={36} />
          <span className="flex flex-col">
            <span
              className="judul-kecil text-base leading-tight"
              style={{ color: "var(--blue-800)" }}
            >
              Digify Laris
            </span>
            <span className="text-[0.6875rem]" style={{ color: "var(--ink-soft)" }}>
              Menu Optimizer
            </span>
          </span>
        </Link>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          <DaftarAlat />
        </div>

        <div
          className="flex items-center justify-between gap-2 px-4 py-3"
          style={{ borderTop: "1px solid var(--line)" }}
        >
          <StatusServer />
          <TombolKeluar />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* ── Bilah atas (HP) ─────────────────────────────────────────── */}
        <header
          className="sticky top-0 z-30 lg:hidden"
          style={{
            background: "rgb(245 248 252 / 90%)",
            backdropFilter: "saturate(1.6) blur(12px)",
            WebkitBackdropFilter: "saturate(1.6) blur(12px)",
            borderBottom: "1px solid var(--line)",
            paddingTop: "env(safe-area-inset-top)",
          }}
        >
          {/* Isinya sengaja hanya dua: nama produk dan pintu ke semua alat.
           * Status server dan tombol keluar pindah ke kaki lembar — bertiga
           * di lebar 360px, semuanya jadi membungkus dua baris. */}
          <div className="flex items-center justify-between gap-3 px-5 py-2.5">
            <Link href="/alat" className="flex min-w-0 items-center gap-2.5">
              <Logo ukuran={34} />
              <span
                className="judul-kecil truncate text-base"
                style={{ color: "var(--blue-800)" }}
              >
                Digify Laris
              </span>
            </Link>

            <LembarAlat status={<StatusServer />} keluar={<TombolKeluar />} />
          </div>
        </header>

        {/* Jarak bawah ditambah tinggi garis geser iPhone. Saat dipasang
         * sebagai aplikasi (viewport-fit: cover), tanpa ini tombol terakhir
         * halaman tertimpa garis itu dan sulit ditekan. */}
        <div
          className="mx-auto w-full max-w-[var(--lebar-alat)] px-5 pt-6 pb-14 sm:px-8 lg:pt-10"
          style={{ paddingBottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}
        >
          <main className="flex flex-col gap-5">{children}</main>
          <NavigasiLanjut />
        </div>
      </div>
    </div>
  );
}
