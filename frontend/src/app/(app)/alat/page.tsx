import Link from "next/link";

import AjakanPasang from "@/components/pwa/AjakanPasang";
import IkonAlat from "@/components/ui/IkonAlat";
import { ambilProfil } from "@/lib/sesiServer";
import { NAMA_KELOMPOK, TABS } from "@/lib/tabs";

export const metadata = { title: "Semua Alat — Digify Laris" };

/**
 * Beranda alat.
 *
 * Dulu halaman ini hanya melempar ke Tab 1. Itu masuk akal selama navigasinya
 * berupa baris pil — sepuluh alat memang sudah "terlihat" di puncak layar.
 * Setelah baris pil dibuang, user butuh satu tempat yang menunjukkan seluruh
 * isi produk sekaligus. Dan itu justru lebih baik daripada langsung dilempar
 * ke sebuah form: ia memilih, bukan sekadar menerima.
 *
 * Di HP, halaman inilah layar utama aplikasi setelah dipasang — `start_url`
 * di manifest menunjuk ke sini.
 */
export default async function BerandaAlatPage() {
  const profil = await ambilProfil();
  // Nama dipakai utuh. Memotongnya jadi "kata pertama" menghasilkan sapaan
  // "Halo, Pak" untuk nama seperti "Pak Budi" — terdengar seperti salah kirim.
  const nama = profil?.full_name?.trim();

  const kelompok = [
    {
      nama: NAMA_KELOMPOK.Profit,
      ringkas: "Enam alat untuk merapikan untung dari menu yang sudah Anda punya.",
      warna: "var(--blue-600)",
      latar: "var(--blue-wash)",
      garis: "var(--blue-100)",
      daftar: TABS.filter((tab) => tab.kelompok === "Profit"),
    },
    {
      nama: NAMA_KELOMPOK.Growth,
      ringkas: "Empat alat untuk membawa pembeli baru, tanpa Canva atau desainer.",
      warna: "var(--orange-600)",
      latar: "var(--orange-wash)",
      garis: "var(--orange-100)",
      daftar: TABS.filter((tab) => tab.kelompok === "Growth"),
    },
  ];

  return (
    <>
      <header>
        <p className="label-kecil" style={{ color: "var(--ink-soft)" }}>
          {nama ? `Halo, ${nama}` : "Selamat datang"}
        </p>
        <h1 className="judul mt-2 text-3xl sm:text-4xl">Mau mengerjakan apa hari ini?</h1>
        <p
          className="teks-rapi mt-2.5 max-w-prose text-sm leading-relaxed"
          style={{ color: "var(--ink-dim)" }}
        >
          Belum tahu mulai dari mana? Mulai dari{" "}
          <span className="font-semibold" style={{ color: "var(--ink)" }}>
            Biaya Menu
          </span>{" "}
          — semua alat lain berdiri di atas angka itu.
        </p>
      </header>

      {/* Hanya muncul kalau browser memang menawarkan pemasangan, dan tidak
       * pernah muncul lagi setelah ditolak sekali. */}
      <AjakanPasang />

      {/* Ajakan langsung ke alat pertama. Untuk orang yang baru pertama masuk,
       * satu tombol besar mengalahkan sepuluh pilihan yang setara. */}
      <Link
        href="/alat/biaya-menu"
        className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5"
        style={{
          background: "var(--grad-panel)",
          borderRadius: "var(--radius-lg)",
          color: "var(--on-dark)",
          boxShadow: "var(--shadow)",
        }}
      >
        <span className="min-w-0">
          <span className="label-kecil" style={{ color: "var(--on-dark-dim)" }}>
            Mulai di sini
          </span>
          <span className="judul-kecil mt-1 block text-lg sm:text-xl">
            Hitung biaya asli satu menu
          </span>
          <span
            className="mt-1 block text-sm leading-relaxed"
            style={{ color: "var(--on-dark-dim)" }}
          >
            Formnya sudah terisi contoh. Kurang dari satu menit.
          </span>
        </span>
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ background: "var(--orange-aksi)", color: "var(--on-dark)" }}
        >
          →
        </span>
      </Link>

      {kelompok.map((mesin) => (
        <section key={mesin.nama}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="judul-kecil text-lg">{mesin.nama}</h2>
            <span className="label-kecil" style={{ color: "var(--ink-soft)" }}>
              {mesin.daftar.length} alat
            </span>
          </div>
          <p
            className="teks-rapi mt-1 text-sm leading-relaxed"
            style={{ color: "var(--ink-dim)" }}
          >
            {mesin.ringkas}
          </p>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {mesin.daftar.map((tab) => (
              <li key={tab.slug}>
                <Link
                  href={`/alat/${tab.slug}`}
                  className="flex h-full gap-3 p-4"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius-lg)",
                    boxShadow: "var(--shadow-xs)",
                  }}
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center"
                    style={{
                      background: mesin.latar,
                      color: mesin.warna,
                      borderRadius: "var(--radius-sm)",
                      border: `1px solid ${mesin.garis}`,
                    }}
                  >
                    <IkonAlat slug={tab.slug} ukuran={22} />
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold">{tab.judul}</span>
                      <span
                        aria-hidden
                        className="tabular text-xs"
                        style={{ color: "var(--ink-soft)" }}
                      >
                        {tab.nomor}
                      </span>
                    </span>
                    <span
                      className="teks-rapi mt-1 block text-xs leading-relaxed"
                      style={{ color: "var(--ink-dim)" }}
                    >
                      {tab.ringkas}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
