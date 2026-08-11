import Link from "next/link";

import { formatRupiah } from "@/lib/format";
import { ambilPanel } from "@/lib/panelServer";
import type { PeristiwaWebhook, Ringkasan } from "@/lib/types/panel";

export const metadata = { title: "Panel — Digify Laris" };
// Angka pengawasan tidak boleh disajikan dari cache: yang dicari di sini
// justru keadaan sekarang.
export const dynamic = "force-dynamic";

/**
 * Halaman ringkasan panel.
 *
 * Urutan kotaknya mengikuti seberapa mahal akibatnya kalau tidak ketahuan,
 * bukan mengikuti urutan tabel database. Webhook bermasalah lebih dulu
 * daripada uang masuk, karena satu webhook gagal berarti satu orang yang sudah
 * membayar tapi mungkin tidak pernah menerima akunnya.
 */

function Kotak({
  label,
  nilai,
  keterangan,
  nada = "biasa",
}: {
  label: string;
  nilai: string;
  keterangan?: string;
  nada?: "biasa" | "waspada" | "bahaya";
}) {
  const warna =
    nada === "bahaya" ? "var(--red)" : nada === "waspada" ? "var(--yellow)" : "var(--blue-600)";

  return (
    <div
      className="p-4"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderLeft: `4px solid ${warna}`,
        borderRadius: "var(--radius)",
      }}
    >
      <p className="label-kecil" style={{ color: "var(--ink-dim)" }}>
        {label}
      </p>
      <p className="tabular judul-kecil mt-1.5 text-2xl" style={{ color: warna }}>
        {nilai}
      </p>
      {keterangan ? (
        <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {keterangan}
        </p>
      ) : null}
    </div>
  );
}

export default async function PanelPage() {
  const ringkasan = await ambilPanel<Ringkasan>("/panel/ringkasan");
  const webhook = await ambilPanel<{ peristiwa: PeristiwaWebhook[] }>("/panel/webhook");

  if (!ringkasan) {
    return (
      <p className="text-sm" style={{ color: "var(--red)" }}>
        Data panel belum bisa dimuat. Coba muat ulang halaman ini.
      </p>
    );
  }

  const gagalPersen = ringkasan.kesehatan_ai.persen_gagal_24jam;

  return (
    <>
      <h1 className="judul text-2xl sm:text-3xl">Ringkasan</h1>
      <p className="mt-1.5 text-sm" style={{ color: "var(--ink-dim)" }}>
        Keadaan per {ringkasan.tanggal}.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kotak
          label="Webhook bermasalah"
          nilai={String(ringkasan.webhook_bermasalah)}
          keterangan="Tiap satu berpotensi berarti pembeli yang sudah bayar tapi belum punya akun."
          nada={ringkasan.webhook_bermasalah > 0 ? "bahaya" : "biasa"}
        />
        <Kotak
          label="Panggilan AI gagal (24 jam)"
          nilai={`${gagalPersen}%`}
          keterangan={`${ringkasan.kesehatan_ai.gagal_24jam} gagal dari ${ringkasan.kesehatan_ai.panggilan_24jam} panggilan.`}
          nada={gagalPersen >= 50 ? "bahaya" : gagalPersen > 10 ? "waspada" : "biasa"}
        />
        <Kotak
          label="Perkiraan biaya AI bulan ini"
          nilai={formatRupiah(ringkasan.biaya_bulan_ini_rupiah)}
          keterangan={`${ringkasan.panggilan_bulan_ini} panggilan. Perkiraan, bukan tagihan.`}
        />
        <Kotak
          label="Belum pernah masuk"
          nilai={String(ringkasan.belum_pernah_masuk)}
          keterangan="Sudah punya akun tapi belum sekali pun login — kredensialnya mungkin tidak sampai."
          nada={ringkasan.belum_pernah_masuk > 0 ? "waspada" : "biasa"}
        />
        <Kotak label="Pembeli aktif" nilai={String(ringkasan.pembeli_aktif)} />
        <Kotak
          label="Lisensi aktif"
          nilai={`${ringkasan.lisensi.aktif} dari ${ringkasan.lisensi.total}`}
        />
        <Kotak
          label="Lisensi bulan ini"
          nilai={String(ringkasan.lisensi.bulan_ini)}
          keterangan={`Nilai ${formatRupiah(ringkasan.lisensi.rupiah_bulan_ini)}.`}
        />
        <Kotak
          label="Selisih bulan ini"
          nilai={formatRupiah(
            ringkasan.lisensi.rupiah_bulan_ini - ringkasan.biaya_bulan_ini_rupiah,
          )}
          keterangan="Uang masuk dikurangi perkiraan biaya AI."
        />
      </div>

      {/* Webhook bermasalah ditampilkan utuh, bukan cuma dihitung: yang
          dibutuhkan saat angkanya tidak nol adalah order_id-nya, supaya bisa
          langsung dicocokkan dengan pembayaran. */}
      {webhook && webhook.peristiwa.length > 0 ? (
        <section className="mt-8">
          <h2 className="judul-kecil text-lg">Webhook yang perlu diperiksa</h2>
          <div className="mt-3 flex flex-col gap-2">
            {webhook.peristiwa.map((satu) => (
              <div
                key={satu.id}
                className="p-3.5"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderLeft: "4px solid var(--red)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <p className="tabular text-sm font-semibold">{satu.external_id}</p>
                <p className="mt-1 text-xs" style={{ color: "var(--ink-dim)" }}>
                  {satu.provider} · {new Date(satu.waktu).toLocaleString("id-ID")} ·{" "}
                  {satu.tanda_tangan_sah ? "tanda tangan sah" : "TANDA TANGAN TIDAK SAH"} ·{" "}
                  {satu.sudah_diproses ? "sudah diproses" : "BELUM diproses"}
                </p>
                {satu.error ? (
                  <p className="teks-rapi mt-1.5 text-xs" style={{ color: "var(--red)" }}>
                    {satu.error}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-8 text-sm">
        <Link href="/panel/klien" style={{ color: "var(--blue-600)" }}>
          Lihat daftar pembeli →
        </Link>
      </p>
    </>
  );
}
