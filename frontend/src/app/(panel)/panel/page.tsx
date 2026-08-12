import Link from "next/link";

import GrafikHarian from "@/components/panel/GrafikHarian";
import { formatRupiah } from "@/lib/format";
import { ambilPanel } from "@/lib/panelServer";
import type { PeristiwaWebhook, Ringkasan } from "@/lib/types/panel";

export const metadata = { title: "Panel — Digify Laris" };
// Angka pengawasan tidak boleh disajikan dari cache: yang dicari di sini
// justru keadaan sekarang.
export const dynamic = "force-dynamic";

/**
 * Dasbor ringkasan panel.
 *
 * ── Kenapa dikelompokkan, bukan dua belas kotak sederajat ─────────────────
 * Versi sebelumnya menampilkan dua belas kotak yang bentuknya persis sama.
 * Akibatnya "64% panggilan AI gagal" — yang berarti produknya sedang rusak —
 * tampil dengan bobot yang sama dengan "Lisensi aktif: 2 dari 2". Mata tidak
 * punya tempat untuk mendarat, jadi tidak ada satu pun angka yang benar-benar
 * terbaca.
 *
 * Sekarang halaman ini menjawab empat pertanyaan berurutan, dan urutannya
 * mengikuti seberapa mahal akibatnya kalau tidak ketahuan:
 *
 *   1. Ada yang perlu ditindak sekarang?  → hanya muncul kalau memang ada
 *   2. Uangnya bagaimana?                 → angka utama, paling besar
 *   3. Layanannya sehat?                  → dengan grafik 14 hari
 *   4. Pembelinya bagaimana?
 *
 * ── Kenapa bagian "perlu ditindak" hilang saat semuanya aman ──────────────
 * Kotak bertuliskan nol tetap menuntut dibaca sebelum bisa diabaikan. Kalau
 * keadaan normal berarti empat kotak nol, maka membaca dasbor ini setiap hari
 * berarti empat kali memastikan tidak terjadi apa-apa — dan kebiasaan itulah
 * yang membuat angka yang akhirnya tidak nol ikut terlewat. Yang tidak
 * bermasalah lebih baik diringkas jadi satu baris tenang.
 */

/** Lebar kolom tabel alat, ditulis sekali supaya judul dan isinya sama. */
const KOLOM_ALAT = "1fr 4rem 4rem 6rem";

/** Angka utama sebuah bagian: besar, dan hanya satu per bagian. */
function AngkaUtama({
  label,
  nilai,
  keterangan,
  warna = "var(--ink)",
}: {
  label: string;
  nilai: string;
  keterangan?: string;
  warna?: string;
}) {
  return (
    <div>
      <p className="label-kecil" style={{ color: "var(--ink-dim)" }}>
        {label}
      </p>
      <p className="judul tabular mt-1 text-4xl leading-none" style={{ color: warna }}>
        {nilai}
      </p>
      {keterangan ? (
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          {keterangan}
        </p>
      ) : null}
    </div>
  );
}

/** Angka pendamping: kecil, boleh banyak. */
function AngkaKecil({
  label,
  nilai,
  keterangan,
  warna,
}: {
  label: string;
  nilai: string;
  keterangan?: string;
  warna?: string;
}) {
  return (
    <div>
      <p className="label-kecil" style={{ color: "var(--ink-dim)" }}>
        {label}
      </p>
      <p className="tabular mt-0.5 text-xl font-semibold" style={{ color: warna ?? "var(--ink)" }}>
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

function Kartu({
  judul,
  anak,
}: {
  judul: string;
  anak: React.ReactNode;
}) {
  return (
    <section
      className="p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <h2 className="judul-kecil text-lg">{judul}</h2>
      {anak}
    </section>
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

  /* Daftar tindakan disusun sebagai data, bukan sebagai markup berulang:
   * yang aman tidak ikut masuk, jadi panjangnya menyesuaikan keadaan. */
  const perluTindakan = [
    ringkasan.webhook_bermasalah > 0 && {
      kunci: "webhook",
      judul: `${ringkasan.webhook_bermasalah} webhook bermasalah`,
      isi: "Tiap satu berpotensi berarti pembeli yang sudah bayar tapi belum punya akun.",
      berat: true,
    },
    gagalPersen >= 10 && {
      kunci: "gagal",
      judul: `${gagalPersen}% panggilan AI gagal dalam 24 jam`,
      isi: `${ringkasan.kesehatan_ai.gagal_24jam} gagal dari ${ringkasan.kesehatan_ai.panggilan_24jam} panggilan. Periksa log backend.`,
      berat: gagalPersen >= 50,
    },
    ringkasan.kredensial_belum_terkirim > 0 && {
      kunci: "kredensial",
      judul: `${ringkasan.kredensial_belum_terkirim} pembeli belum menerima kredensial`,
      isi: "Buka pembelinya, lalu tekan “Kirim kata sandi baru lewat email”.",
      berat: true,
    },
    ringkasan.mentok_kuota_hari_ini > 0 && {
      kunci: "kuota",
      judul: `${ringkasan.mentok_kuota_hari_ini} pembeli mentok jatah hari ini`,
      isi: "Kalau sering terjadi, batas hariannya terlalu ketat.",
      berat: false,
    },
  ].filter(Boolean) as { kunci: string; judul: string; isi: string; berat: boolean }[];

  return (
    <>
      <h1 className="judul text-2xl sm:text-3xl">Ringkasan</h1>
      <p className="mt-1.5 text-sm" style={{ color: "var(--ink-dim)" }}>
        Keadaan per {ringkasan.tanggal}.
      </p>

      {/* ── 1. Perlu ditindak ─────────────────────────────────────────── */}
      {perluTindakan.length > 0 ? (
        <section className="mt-5 flex flex-col gap-2">
          {perluTindakan.map((satu) => (
            <div
              key={satu.kunci}
              className="p-4"
              style={{
                background: satu.berat ? "var(--red-wash)" : "var(--yellow-wash)",
                border: `1px solid ${satu.berat ? "var(--red)" : "var(--yellow)"}`,
                borderRadius: "var(--radius)",
              }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: satu.berat ? "var(--red)" : "var(--yellow)" }}
              >
                {satu.judul}
              </p>
              <p className="teks-rapi mt-1 text-sm leading-relaxed">{satu.isi}</p>
            </div>
          ))}
        </section>
      ) : (
        <p
          className="mt-5 px-4 py-3 text-sm"
          style={{
            background: "var(--green-wash)",
            color: "var(--green)",
            borderRadius: "var(--radius)",
          }}
        >
          Tidak ada yang perlu ditindak hari ini.
        </p>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ── 2. Uang ─────────────────────────────────────────────────── */}
        <Kartu
          judul="Uang bulan ini"
          anak={
            <>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <AngkaUtama
                  label="Masuk dari lisensi"
                  nilai={formatRupiah(ringkasan.lisensi.rupiah_bulan_ini)}
                  keterangan={`${ringkasan.lisensi.bulan_ini} lisensi baru.`}
                  warna="var(--green)"
                />
                <AngkaUtama
                  label="Perkiraan biaya AI"
                  nilai={formatRupiah(ringkasan.biaya_bulan_ini_rupiah)}
                  keterangan={`${ringkasan.panggilan_bulan_ini} panggilan.`}
                  warna="var(--orange-600)"
                />
              </div>

              <div
                className="mt-4 grid grid-cols-2 gap-4 pt-4"
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <AngkaKecil
                  label="Selisih"
                  nilai={formatRupiah(
                    ringkasan.lisensi.rupiah_bulan_ini - ringkasan.biaya_bulan_ini_rupiah,
                  )}
                />
                <AngkaKecil
                  label="Biaya per pembeli"
                  nilai={formatRupiah(ringkasan.biaya_per_pembeli_rupiah)}
                  keterangan="Bandingkan dengan harga lifetime."
                />
                <AngkaKecil
                  label="Biaya hari ini"
                  nilai={formatRupiah(ringkasan.biaya_hari_ini_rupiah)}
                  keterangan={`${ringkasan.panggilan_hari_ini} panggilan.`}
                />
                <AngkaKecil
                  label="Lisensi aktif"
                  nilai={`${ringkasan.lisensi.aktif} dari ${ringkasan.lisensi.total}`}
                />
              </div>

              {/* Tanpa catatan ini, "Rp 0 dari 22 panggilan" terbaca sebagai
                  gratis — padahal artinya belum tercatat. */}
              {ringkasan.ada_panggilan_tanpa_biaya ? (
                <p
                  className="teks-rapi mt-4 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-xs leading-relaxed"
                  style={{ background: "var(--surface-2)", color: "var(--ink-dim)" }}
                >
                  Sebagian panggilan bulan ini terjadi sebelum pencatatan token dimulai, jadi
                  biayanya tidak ikut terhitung. Angka biaya baru lengkap untuk panggilan sejak
                  12 Agustus 2026.
                </p>
              ) : null}
            </>
          }
        />

        {/* ── 3. Pembeli ──────────────────────────────────────────────── */}
        <Kartu
          judul="Pembeli"
          anak={
            <>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <AngkaUtama
                  label="Pembeli aktif"
                  nilai={String(ringkasan.pembeli_aktif)}
                  keterangan={`${ringkasan.pembeli_baru_bulan_ini} bergabung bulan ini.`}
                />
                <AngkaUtama
                  label="Belum pernah masuk"
                  nilai={String(ringkasan.belum_pernah_masuk)}
                  keterangan="Sudah punya akun tapi belum sekali pun login."
                  warna={
                    ringkasan.belum_pernah_masuk > 0 ? "var(--yellow)" : "var(--ink)"
                  }
                />
              </div>

              <div
                className="mt-4 grid grid-cols-2 gap-4 pt-4"
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <AngkaKecil
                  label="Kredensial belum terkirim"
                  nilai={String(ringkasan.kredensial_belum_terkirim)}
                  warna={
                    ringkasan.kredensial_belum_terkirim > 0 ? "var(--red)" : "var(--ink)"
                  }
                />
                <AngkaKecil
                  label="Mentok jatah hari ini"
                  nilai={String(ringkasan.mentok_kuota_hari_ini)}
                />
              </div>

              <p className="mt-4 text-sm">
                <Link href="/panel/klien" style={{ color: "var(--blue-600)" }}>
                  Lihat daftar pembeli →
                </Link>
              </p>
            </>
          }
        />
      </div>

      {/* ── 4. Kesehatan layanan ──────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GrafikHarian harian={ringkasan.harian} />
        </div>

        <Kartu
          judul="Mutu layanan"
          anak={
            <div className="mt-4 flex flex-col gap-4">
              <AngkaUtama
                label="Panggilan gagal (24 jam)"
                nilai={`${gagalPersen}%`}
                keterangan={`${ringkasan.kesehatan_ai.gagal_24jam} dari ${ringkasan.kesehatan_ai.panggilan_24jam} panggilan.`}
                warna={
                  gagalPersen >= 50
                    ? "var(--red)"
                    : gagalPersen > 10
                      ? "var(--yellow)"
                      : "var(--green)"
                }
              />
              <AngkaKecil
                label="Rata-rata lama panggilan"
                nilai={`${(ringkasan.rata_lama_ms / 1000).toFixed(1)} detik`}
                keterangan="Hanya yang berhasil, 24 jam terakhir."
                warna={ringkasan.rata_lama_ms > 25_000 ? "var(--yellow)" : undefined}
              />
            </div>
          }
        />
      </div>

      {/* ── Alat yang dipakai ─────────────────────────────────────────── */}
      {ringkasan.pemakaian_per_alat.length > 0 ? (
        <section className="mt-4">
          <h2 className="judul-kecil text-lg">Alat yang dipakai bulan ini</h2>
          <div
            className="mt-3 overflow-x-auto"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
            }}
          >
            <div style={{ minWidth: 460 }}>
              <div
                className="label-kecil grid gap-x-4 px-4 py-2.5"
                style={{
                  gridTemplateColumns: KOLOM_ALAT,
                  borderBottom: "1px solid var(--line)",
                  color: "var(--ink-soft)",
                }}
              >
                <span>Alat</span>
                <span className="text-right">Pakai</span>
                <span className="text-right">Gagal</span>
                <span className="text-right">Biaya</span>
              </div>
              {ringkasan.pemakaian_per_alat.map((satu, indeks) => {
                const terbanyak = Math.max(
                  ...ringkasan.pemakaian_per_alat.map((lain) => lain.panggilan),
                  1,
                );

                return (
                  <div
                    key={satu.endpoint}
                    style={{ borderTop: indeks === 0 ? "none" : "1px solid var(--line)" }}
                  >
                    <div
                      className="tabular grid items-baseline gap-x-4 px-4 pt-2 text-sm"
                      style={{ gridTemplateColumns: KOLOM_ALAT }}
                    >
                      <span>{satu.endpoint}</span>
                      <span className="text-right">{satu.panggilan}</span>
                      <span
                        className="text-right"
                        style={{ color: satu.gagal > 0 ? "var(--red)" : "var(--ink-soft)" }}
                      >
                        {satu.gagal}
                      </span>
                      <span className="text-right">{formatRupiah(satu.biaya_rupiah)}</span>
                    </div>

                    {/* Satu warna untuk semua batang, bukan gradasi menurut
                        besarnya: panjang batang SUDAH menyatakan besarnya, dan
                        mewarnainya lagi menurut angka yang sama membuang satu-
                        satunya kanal yang tersisa untuk hal lain. */}
                    <div className="px-4 pt-1.5 pb-2.5">
                      <div
                        style={{
                          height: 4,
                          width: `${(satu.panggilan / terbanyak) * 100}%`,
                          background: "var(--blue-500)",
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

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
    </>
  );
}
