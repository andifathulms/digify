import Link from "next/link";
import { redirect } from "next/navigation";

import Logo from "@/components/ui/Logo";
import MenuAkun from "@/components/ui/MenuAkun";
import { ambilProfil } from "@/lib/sesiServer";

export const metadata = { title: "Profil saya — Digify Laris" };
export const dynamic = "force-dynamic";

/**
 * Halaman profil.
 *
 * Isinya sengaja sedikit, dan itu bukan kekurangan: satu-satunya hal yang
 * benar-benar bisa diubah sendiri seorang pembeli adalah kata sandinya. Nama,
 * email, dan nomor WhatsApp datang dari pembayaran di affiliate.id — dibuat
 * bisa disunting di sini, keduanya akan berbeda dari data pembayaran tanpa ada
 * yang tahu yang mana yang benar. Yang butuh mengubahnya menghubungi kami, dan
 * operasional mengubahnya dari panel.
 *
 * Kerangkanya berdiri sendiri, tidak memakai rangka /alat: halaman ini juga
 * dituju dari halaman pemasaran, dan menyeret sidebar sepuluh alat ke sini
 * membuat orang mengira ia sudah masuk ke dalam aplikasi.
 */

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div
      className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-3"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <span className="text-sm" style={{ color: "var(--ink-dim)" }}>
        {label}
      </span>
      <span className="text-sm font-medium">{nilai}</span>
    </div>
  );
}

export default async function ProfilPage() {
  const profil = await ambilProfil();
  if (!profil) redirect("/masuk");

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg)" }}>
      <header
        className="sticky top-0 z-30"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/alat" className="flex items-center gap-2.5">
            <Logo ukuran={32} />
            <span className="judul-kecil text-base" style={{ color: "var(--blue-800)" }}>
              Digify Laris
            </span>
          </Link>
          <MenuAkun />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="judul text-2xl sm:text-3xl">Profil saya</h1>

        <section
          className="mt-5 p-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h2 className="judul-kecil text-lg">Data akun</h2>
          <div className="mt-3">
            <Baris label="Nama" nilai={profil.full_name || "belum diisi"} />
            <Baris label="Email" nilai={profil.email} />
            <Baris label="WhatsApp" nilai={profil.whatsapp || "belum diisi"} />
          </div>

          <p className="teks-rapi mt-4 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
            Data di atas ikut dari pembayaran Anda. Kalau ada yang perlu diperbaiki, hubungi kami
            lewat WhatsApp — kami yang mengubahkannya.
          </p>
        </section>

        <section
          className="mt-4 p-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h2 className="judul-kecil text-lg">Kata sandi</h2>
          <p className="teks-rapi mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
            Ganti secara berkala, dan jangan pakai kata sandi yang sama dengan akun lain.
          </p>
          <Link
            href="/masuk/ganti-kata-sandi"
            className="label-isian mt-3 inline-flex items-center rounded-[var(--radius-sm)] px-5 text-sm font-semibold"
            style={{
              minHeight: "var(--tap)",
              background: "var(--surface)",
              border: "1px solid var(--line-strong)",
              color: "var(--ink)",
            }}
          >
            Ganti kata sandi
          </Link>
        </section>

        <p className="mt-6 text-sm">
          <Link href="/alat" style={{ color: "var(--blue-600)" }}>
            ← Kembali ke alat
          </Link>
        </p>
      </main>
    </div>
  );
}
