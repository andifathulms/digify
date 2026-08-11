import Link from "next/link";

import { formatRupiah } from "@/lib/format";
import { ambilPanel } from "@/lib/panelServer";
import type { BarisKlien } from "@/lib/types/panel";

export const metadata = { title: "Pembeli — Panel Digify Laris" };
export const dynamic = "force-dynamic";

/**
 * Daftar pembeli beserta pemakaian dan perkiraan biayanya.
 *
 * Pencarian lewat query string dan form GET biasa, tanpa "use client":
 * halamannya cuma menampilkan, dan menjadikannya komponen klien berarti
 * seluruh daftar ikut dikirim dua kali — sekali sebagai HTML, sekali sebagai
 * data — tanpa satu pun kemampuan tambahan.
 */
export default async function DaftarKlienPage({
  searchParams,
}: {
  searchParams: Promise<{ cari?: string }>;
}) {
  const { cari = "" } = await searchParams;
  const data = await ambilPanel<{ klien: BarisKlien[] }>(
    `/panel/klien${cari ? `?cari=${encodeURIComponent(cari)}` : ""}`,
  );

  const klien = data?.klien ?? [];

  return (
    <>
      <h1 className="judul text-2xl sm:text-3xl">Pembeli</h1>
      <p className="mt-1.5 text-sm" style={{ color: "var(--ink-dim)" }}>
        {klien.length} pembeli{cari ? ` cocok dengan “${cari}”` : ""}. Diurutkan dari yang paling
        banyak memakai bulan ini.
      </p>

      <form method="get" className="mt-4 flex flex-wrap gap-2">
        <input
          type="search"
          name="cari"
          defaultValue={cari}
          placeholder="Cari email, nama, atau nomor WhatsApp"
          className="isian flex-1 px-3 py-2.5 text-base"
          style={{ minWidth: 240 }}
        />
        <button
          type="submit"
          className="label-isian rounded-[var(--radius-sm)] px-5 text-sm font-semibold"
          style={{
            minHeight: "var(--tap)",
            background: "var(--surface)",
            border: "1px solid var(--line-strong)",
          }}
        >
          Cari
        </button>
      </form>

      {klien.length === 0 ? (
        <p className="mt-6 text-sm" style={{ color: "var(--ink-dim)" }}>
          {cari
            ? "Tidak ada pembeli yang cocok. Coba kata kunci lain."
            : "Belum ada pembeli sama sekali."}
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {klien.map((satu) => (
            <Link
              key={satu.id}
              href={`/panel/klien/${satu.id}`}
              className="block p-4"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "var(--radius)",
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-sm font-semibold">{satu.nama || satu.email}</span>
                <span className="tabular text-sm" style={{ color: "var(--ink-dim)" }}>
                  {formatRupiah(satu.biaya_bulan_ini_rupiah)} bulan ini
                </span>
              </div>

              <p className="mt-1 text-xs" style={{ color: "var(--ink-soft)" }}>
                {satu.email}
                {satu.whatsapp ? ` · ${satu.whatsapp}` : ""} · bergabung {satu.bergabung}
              </p>

              {/* Grid berkolom tetap, bukan flex: dengan flex, angka tiap
                  pembeli berhenti di tempat berbeda menurut panjang angkanya,
                  dan daftar sepuluh pembeli jadi tidak bisa dibandingkan
                  sekilas. Label di atas angka, bukan di sampingnya, supaya
                  angkanya yang menonjol. */}
              <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
                {[
                  { label: "Bulan ini", nilai: `${satu.panggilan_bulan_ini}×` },
                  { label: "Hari ini", nilai: `${satu.panggilan_hari_ini}×` },
                  { label: "Sisa hari ini", nilai: String(satu.sisa_hari_ini) },
                  {
                    label: "Gagal bulan ini",
                    nilai: String(satu.gagal_bulan_ini),
                    merah: satu.gagal_bulan_ini > 0,
                  },
                ].map((kotak) => (
                  <div key={kotak.label}>
                    <p className="label-kecil" style={{ color: "var(--ink-soft)" }}>
                      {kotak.label}
                    </p>
                    <p
                      className="tabular text-sm font-semibold"
                      style={{ color: kotak.merah ? "var(--red)" : "var(--ink)" }}
                    >
                      {kotak.nilai}
                    </p>
                  </div>
                ))}
              </div>

              {/* Dua keadaan yang butuh tindakan, ditandai di daftar supaya
                  tidak perlu membuka satu per satu untuk menemukannya. */}
              <div className="mt-2 flex flex-wrap gap-2">
                {!satu.aktif ? (
                  <span
                    className="label-kecil rounded-[var(--radius-pill)] px-2.5 py-1"
                    style={{ background: "var(--red-wash)", color: "var(--red)" }}
                  >
                    nonaktif
                  </span>
                ) : null}
                {satu.belum_pernah_masuk ? (
                  <span
                    className="label-kecil rounded-[var(--radius-pill)] px-2.5 py-1"
                    style={{ background: "var(--yellow-wash)", color: "var(--yellow)" }}
                  >
                    belum pernah masuk
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
