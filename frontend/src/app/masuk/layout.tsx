import Link from "next/link";

import Logo from "@/components/ui/Logo";

/**
 * Rangka halaman masuk.
 *
 * Di layar lebar, form ditemani panel biru berisi pengingat singkat isi
 * produknya. Halaman masuk adalah tempat pembeli mendarat setelah membayar,
 * kadang berhari-hari kemudian; panel itu menjawab "ya, ini yang saya beli"
 * sebelum ia sempat ragu. Di HP panelnya disembunyikan — di sana yang
 * dibutuhkan hanya dua isian dan satu tombol, secepat mungkin.
 */

const PENGINGAT = [
  "Hitung biaya asli dan untung tiap menu",
  "Harga di tempat dan harga ojol, dihitung terpisah",
  "Caption, hashtag, dan carousel siap posting",
];

export default function MasukLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <aside
        className="hidden flex-col justify-between p-10 lg:flex xl:p-14"
        style={{ background: "var(--grad-panel)" }}
      >
        <Link href="/" className="flex items-center gap-3">
          <Logo ukuran={40} />
          <span className="flex flex-col">
            <span
              className="judul-kecil text-lg leading-tight"
              style={{ color: "var(--on-dark)" }}
            >
              Digify Laris
            </span>
            <span className="text-xs" style={{ color: "var(--on-dark-dim)" }}>
              Hitung Untung Menu
            </span>
          </span>
        </Link>

        <div>
          <h2 className="judul max-w-md text-3xl xl:text-4xl" style={{ color: "var(--on-dark)" }}>
            Selamat datang kembali. Warung Anda menunggu hitungannya.
          </h2>
          <ul className="mt-8 flex max-w-md flex-col gap-3">
            {PENGINGAT.map((baris) => (
              <li
                key={baris}
                className="flex items-start gap-3 text-sm leading-relaxed"
                style={{ color: "var(--on-dark-dim)" }}
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-2xs font-bold"
                  style={{ background: "var(--orange-aksi)", color: "var(--on-dark)" }}
                >
                  ✓
                </span>
                {baris}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs" style={{ color: "var(--on-dark-dim)" }}>
          Digify.ID · Digital. Make Simple
        </p>
      </aside>

      <div className="flex flex-col justify-center px-5 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-7 flex items-center justify-center gap-2.5 lg:hidden">
            <Logo ukuran={38} />
            <span className="flex flex-col">
              <span
                className="judul-kecil text-lg leading-tight"
                style={{ color: "var(--blue-800)" }}
              >
                Digify Laris
              </span>
              <span className="text-xs" style={{ color: "var(--ink-dim)" }}>
                Hitung Untung Menu
              </span>
            </span>
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
