import Link from "next/link";
import { notFound } from "next/navigation";

import TindakanKlien from "@/components/panel/TindakanKlien";
import { formatRupiah } from "@/lib/format";
import { ambilPanel } from "@/lib/panelServer";
import type { DetailKlien } from "@/lib/types/panel";

export const metadata = { title: "Detail pembeli — Panel Digify Laris" };
export const dynamic = "force-dynamic";

function Baris({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-1.5">
      <span className="text-sm" style={{ color: "var(--ink-dim)" }}>
        {label}
      </span>
      <span className="tabular text-sm font-medium">{nilai}</span>
    </div>
  );
}

export default async function DetailKlienPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const klien = await ambilPanel<DetailKlien>(`/panel/klien/${id}`);
  if (!klien) notFound();

  const biayaBulanIni = klien.pemakaian_per_alat.reduce((jumlah, satu) => jumlah + satu.biaya_rupiah, 0);

  return (
    <>
      <p className="text-sm">
        <Link href="/panel/klien" style={{ color: "var(--blue-600)" }}>
          ← Semua pembeli
        </Link>
      </p>

      <h1 className="judul mt-2 text-2xl sm:text-3xl">{klien.nama || klien.email}</h1>
      <p className="mt-1.5 text-sm" style={{ color: "var(--ink-dim)" }}>
        {klien.email}
        {klien.whatsapp ? ` · ${klien.whatsapp}` : ""}
      </p>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section
          className="p-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h2 className="judul-kecil text-lg">Akun</h2>
          <div className="mt-2" style={{ borderTop: "1px solid var(--line)" }}>
            <Baris label="Status" nilai={klien.aktif ? "aktif" : "nonaktif"} />
            <Baris label="Bergabung" nilai={klien.bergabung} />
            <Baris label="Terakhir masuk" nilai={klien.terakhir_masuk ?? "belum pernah"} />
            <Baris
              label="Wajib ganti kata sandi"
              nilai={klien.wajib_ganti_sandi ? "ya" : "tidak"}
            />
            <Baris label="Sisa jatah hari ini" nilai={String(klien.sisa_hari_ini)} />
            <Baris label="Sisa jatah bulan ini" nilai={String(klien.sisa_bulan_ini)} />
          </div>
        </section>

        <section
          className="p-5"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <h2 className="judul-kecil text-lg">Lisensi</h2>
          {klien.lisensi.length === 0 ? (
            <p className="mt-2 text-sm" style={{ color: "var(--ink-dim)" }}>
              Belum ada lisensi tercatat. Kalau ia sudah membayar, periksa daftar webhook di
              halaman ringkasan.
            </p>
          ) : (
            <div className="mt-2" style={{ borderTop: "1px solid var(--line)" }}>
              {klien.lisensi.map((satu) => (
                <div key={satu.key} className="py-2">
                  <Baris label="Status" nilai={satu.status} />
                  <Baris label="Order" nilai={satu.order_id || "—"} />
                  <Baris label="Nilai" nilai={formatRupiah(satu.amount)} />
                  <Baris label="Aktif sejak" nilai={satu.activated_at ?? "—"} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section
        className="mt-4 p-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="judul-kecil text-lg">Pemakaian bulan ini</h2>
          <span className="tabular text-sm" style={{ color: "var(--ink-dim)" }}>
            {formatRupiah(biayaBulanIni)} · perkiraan
          </span>
        </div>

        {klien.pemakaian_per_alat.length === 0 ? (
          <p className="mt-2 text-sm" style={{ color: "var(--ink-dim)" }}>
            Belum ada pemakaian AI bulan ini.
          </p>
        ) : (
          <div className="mt-2" style={{ borderTop: "1px solid var(--line)" }}>
            {klien.pemakaian_per_alat.map((satu) => (
              <Baris
                key={satu.endpoint}
                label={`${satu.endpoint}${satu.gagal ? ` · ${satu.gagal} gagal` : ""}`}
                nilai={`${satu.panggilan}× · ${formatRupiah(satu.biaya_rupiah)}`}
              />
            ))}
          </div>
        )}
      </section>

      <TindakanKlien
        userId={klien.id}
        aktif={klien.aktif}
        sisaHariIni={klien.sisa_hari_ini}
      />

      {klien.panggilan_terakhir.length > 0 ? (
        <section className="mt-4">
          <h2 className="judul-kecil text-lg">20 panggilan terakhir</h2>
          <div className="mt-2 flex flex-col gap-1">
            {klien.panggilan_terakhir.map((satu, indeks) => (
              <div
                key={`${satu.waktu}-${indeks}`}
                className="tabular flex flex-wrap justify-between gap-x-4 px-3.5 py-2 text-xs"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-xs)",
                  color: satu.status === "error" ? "var(--red)" : "var(--ink)",
                }}
              >
                <span>{new Date(satu.waktu).toLocaleString("id-ID")}</span>
                <span>{satu.endpoint}</span>
                <span>{satu.status}</span>
                <span>{satu.lama_ms} ms</span>
                <span>{formatRupiah(satu.biaya_rupiah)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
