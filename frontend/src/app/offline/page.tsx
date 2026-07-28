import Link from "next/link";

import Logo from "@/components/ui/Logo";

export const metadata = { title: "Sedang Offline — Digify Laris" };

/**
 * Halaman yang muncul saat aplikasi dibuka tanpa internet.
 *
 * Disimpan oleh service worker sejak pemasangan. Isinya harus sepenuhnya
 * berdiri sendiri: tidak memanggil API, tidak butuh data sesi, dan tidak
 * menjanjikan apa pun yang butuh jaringan.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10 text-center">
      <div className="flex justify-center">
        <Logo ukuran={52} />
      </div>

      <h1 className="judul mt-6 text-[1.75rem]">Sedang tidak ada internet</h1>

      <p
        className="teks-rapi mt-3 text-[0.9375rem] leading-relaxed"
        style={{ color: "var(--ink-dim)" }}
      >
        Hitungan menu butuh sambungan ke server kami. Coba nyalakan data atau
        dekati Wi-Fi, lalu buka lagi — isian Anda tidak ke mana-mana.
      </p>

      <Link
        href="/alat"
        className="mt-8 inline-flex items-center justify-center px-7 text-base font-semibold"
        style={{
          minHeight: "52px",
          background: "var(--grad-cta)",
          color: "var(--on-dark)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-cta)",
        }}
      >
        Coba buka lagi
      </Link>
    </main>
  );
}
