import Link from "next/link";
import { redirect } from "next/navigation";

import Logo from "@/components/ui/Logo";
import NavigasiLanjut from "@/components/ui/NavigasiLanjut";
import NavigasiTab from "@/components/ui/NavigasiTab";
import StatusServer from "@/components/ui/StatusServer";
import TombolKeluar from "@/components/ui/TombolKeluar";
import { ambilProfil } from "@/lib/sesiServer";

export default async function AlatLayout({ children }: { children: React.ReactNode }) {
  // Penjagaan sesungguhnya ada di backend — setiap endpoint AI menolak request
  // tanpa token. Pemeriksaan di sini semata supaya user tidak melihat sepuluh
  // form yang tombolnya pasti gagal saat ditekan.
  const profil = await ambilProfil();
  if (!profil) redirect("/masuk");
  if (profil.must_change_password) redirect("/masuk/ganti-kata-sandi");

  return (
    <div className="min-h-dvh">
      {/*
       * Header menempel di atas, dan baris tab ikut menempel bersamanya.
       * Halaman alat panjang: form penuh isian lalu hasil sepanjang satu
       * layar. Kalau navigasi ikut tergulir hilang, satu-satunya cara pindah
       * alat adalah menggulir balik ke paling atas — di HP itu belasan
       * usapan jempol setiap kali.
       *
       * Latarnya buram (backdrop-filter) supaya isi halaman tetap terasa
       * mengalir di bawahnya, bukan terpotong garis putih.
       */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgb(245 248 252 / 88%)",
          backdropFilter: "saturate(1.6) blur(12px)",
          WebkitBackdropFilter: "saturate(1.6) blur(12px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="mx-auto w-full max-w-[var(--lebar-alat)] px-5 sm:px-8">
          <div className="flex items-center justify-between gap-3 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo ukuran={34} />
              <span className="flex flex-col">
                <span
                  className="judul-kecil text-[0.9375rem] leading-tight"
                  style={{ color: "var(--blue-800)" }}
                >
                  Digify Laris
                </span>
                <span className="text-[0.6875rem]" style={{ color: "var(--ink-soft)" }}>
                  Menu Optimizer
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-2">
              <StatusServer />
              <TombolKeluar />
            </div>
          </div>

          <div className="pb-2">
            <NavigasiTab />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[var(--lebar-alat)] px-5 pt-6 pb-16 sm:px-8 sm:pt-8">
        <main className="flex flex-col gap-5">{children}</main>
        <NavigasiLanjut />
      </div>
    </div>
  );
}
