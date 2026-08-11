import Link from "next/link";

import TombolKeluar from "@/components/ui/TombolKeluar";
import { ambilProfil } from "@/lib/sesiServer";

/**
 * Nama pemakai beserta menu ringkasnya, untuk dipasang di kepala halaman.
 *
 * ── Kenapa ada ────────────────────────────────────────────────────────────
 * Kepala halaman pemasaran selalu menampilkan tombol "Masuk", termasuk kepada
 * orang yang SEDANG masuk. Bagi pembeli yang sudah membayar, halaman depan
 * produknya sendiri jadi terlihat seperti tidak mengenalinya — dan satu-satunya
 * jalan kembali ke aplikasi adalah mengetik alamatnya sendiri.
 *
 * ── Kenapa <details>, bukan komponen klien ────────────────────────────────
 * Dropdown ini butuh buka-tutup, dan itu satu-satunya perilakunya. <details>
 * sudah melakukannya di dalam peramban: tanpa JavaScript, tanpa state, tetap
 * bisa dibuka dengan keyboard, dan tetap bekerja sebelum React sempat hidup.
 * Menjadikannya komponen klien berarti mengirim JavaScript ke halaman
 * pemasaran — halaman yang justru paling sering dibuka di HP lambat.
 *
 * Menutupnya saat mengeklik di luar memang tidak ada. Itu memang harga
 * <details>, dan untuk menu berisi tiga tautan, harganya murah.
 */
export default async function MenuAkun({ dariPanel = false }: { dariPanel?: boolean }) {
  const profil = await ambilProfil();

  // Belum masuk: kepala halaman tetap seperti semula, mengajak masuk.
  if (!profil) {
    return (
      <Link
        href="/masuk"
        className="inline-flex items-center px-4 text-sm font-semibold"
        style={{
          minHeight: "var(--tap)",
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-sm)",
          color: "var(--ink)",
        }}
      >
        Masuk
      </Link>
    );
  }

  const nama = profil.full_name?.trim() || profil.email;

  return (
    <details className="group relative">
      <summary
        className="inline-flex cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold"
        style={{
          minHeight: "var(--tap)",
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-sm)",
          color: "var(--ink)",
        }}
      >
        {/* Huruf pertama sebagai penanda, bukan foto: tidak ada satu pun foto
            pemakai di produk ini, dan menambah tempatnya berarti menambah
            unggahan, penyimpanan, dan moderasi demi hiasan. */}
        <span
          aria-hidden
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
          style={{ background: "var(--blue-wash)", color: "var(--blue-700)" }}
        >
          {nama.slice(0, 1).toUpperCase()}
        </span>
        <span className="max-w-[9rem] truncate">{nama}</span>
        <span aria-hidden style={{ color: "var(--ink-soft)" }}>
          ▾
        </span>
      </summary>

      <div
        className="absolute right-0 z-40 mt-1 flex w-56 flex-col p-1.5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow)",
        }}
      >
        <p className="truncate px-2.5 pt-1 pb-2 text-xs" style={{ color: "var(--ink-soft)" }}>
          {profil.email}
        </p>

        <Link
          href="/profil"
          className="rounded-[var(--radius-xs)] px-2.5 py-2 text-sm"
          style={{ minHeight: "var(--tap)", display: "flex", alignItems: "center" }}
        >
          Profil saya
        </Link>

        <Link
          href="/alat"
          className="rounded-[var(--radius-xs)] px-2.5 py-2 text-sm"
          style={{ minHeight: "var(--tap)", display: "flex", alignItems: "center" }}
        >
          Ke aplikasi
        </Link>

        {/* Panel hanya muncul untuk yang memang boleh membukanya. Menampilkan
            tautan yang pasti ditolak cuma membuat orang mengira ada yang
            rusak. Penjagaan sesungguhnya tetap di backend. */}
        {profil.boleh_panel && !dariPanel ? (
          <Link
            href="/panel"
            className="rounded-[var(--radius-xs)] px-2.5 py-2 text-sm"
            style={{ minHeight: "var(--tap)", display: "flex", alignItems: "center" }}
          >
            Panel pengawasan
          </Link>
        ) : null}

        {/* Keluar dipisah garis dan ditaruh paling bawah: ia satu-satunya
            pilihan di menu ini yang membatalkan pekerjaan orang, dan jarak
            adalah cara paling murah mencegahnya tertekan tanpa sengaja. */}
        <div className="mt-1 flex pt-1.5" style={{ borderTop: "1px solid var(--line)" }}>
          <TombolKeluar />
        </div>
      </div>
    </details>
  );
}
