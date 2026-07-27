import Link from "next/link";
import { redirect } from "next/navigation";

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
    <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="flex flex-col">
          <span
            className="text-lg leading-tight font-bold"
            style={{ fontFamily: "var(--font-fraunces)", color: "var(--blue-deep)" }}
          >
            Digify Laris
          </span>
          <span className="text-xs" style={{ color: "var(--ink-dim)" }}>
            Menu Optimizer
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <StatusServer />
          <TombolKeluar />
        </div>
      </header>

      <div className="mt-5">
        <NavigasiTab />
      </div>

      <main className="mt-6 flex flex-col gap-5">{children}</main>
    </div>
  );
}
