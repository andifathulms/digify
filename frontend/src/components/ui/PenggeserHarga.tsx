"use client";

import { warnaStatus } from "@/components/ui/StatusPita";
import { AMBANG_MARGIN_SEHAT, statusDariMargin } from "@/lib/aturan";
import { formatPersen, formatRupiah } from "@/lib/format";
import { angkaSah, useUrlState } from "@/lib/useUrlState";

/**
 * Penggeser harga: geser harganya, lihat untungnya bergerak.
 *
 * ── Kenapa ini sempat ditolak, dan kenapa akhirnya dibangun begini ──────────
 * Alat yang bisa digeser mengundang orang menggeser sampai angkanya terlihat
 * enak. Itu persis kebiasaan "kira-kira" yang produk ini ada untuk
 * menggantikan, dan penggeser tanpa rambu hanya memberinya tampilan yang lebih
 * meyakinkan.
 *
 * Rambunya karena itu dipasang di dalam:
 *  - Tidak bisa digeser di bawah titik balik modal. Harga rugi bukan pilihan
 *    yang perlu disediakan.
 *  - Warnanya memakai ambang yang SAMA dengan papan ranking (lib/aturan.ts),
 *    jadi menggeser ke margin tipis langsung berubah kuning lalu merah.
 *  - Titik balik modal dan harga yang disarankan ditandai di atas relnya, jadi
 *    selalu terlihat sedang berada di sebelah mana.
 *  - Kelipatan 500, sama dengan KELIPATAN_HARGA di backend — tidak ada harga
 *    Rp 24.387 di dunia warung.
 *
 * Hasilnya bukan alat mengarang harga, melainkan cara melihat BENTUK hubungan
 * harga dan untung: berapa yang hilang tiap Rp 500 diturunkan, dan di titik
 * mana warnanya berubah. Angka tunggal tidak pernah bisa menunjukkan itu.
 *
 * Seluruh hitungannya rumus yang sama dengan backend, dijalankan di browser.
 * Tidak ada panggilan jaringan: menggeser tidak boleh menunggu 10–30 detik,
 * dan tidak boleh memakan kuota.
 */

const KELIPATAN = 500;

function bulatkanKeKelipatan(nilai: number): number {
  return Math.round(nilai / KELIPATAN) * KELIPATAN;
}

export default function PenggeserHarga({
  biayaBahan,
  hargaDisarankan,
  balikModal,
  komisi,
}: {
  biayaBahan: number;
  hargaDisarankan: number;
  /** Titik balik modal di tempat — batas bawah penggeser. */
  balikModal: number;
  komisi: number;
}) {
  const minimum = Math.max(bulatkanKeKelipatan(balikModal), KELIPATAN);
  const maksimum = Math.max(bulatkanKeKelipatan(hargaDisarankan * 1.6), minimum + KELIPATAN * 10);
  const bawaan = bulatkanKeKelipatan(hargaDisarankan);
  const [tersimpan, setHarga] = useUrlState("geser", bawaan, angkaSah);

  // Nilai dari URL bisa berasal dari hitungan sebelumnya — biaya bahan diubah,
  // rentangnya bergeser, tapi alamatnya masih membawa harga lama. Kalau di
  // luar rentang sekarang, harga yang disarankan yang dipakai. Dijepit, bukan
  // dipaksa masuk: menggeser angka lama ke tepi rentang baru akan menampilkan
  // harga yang tidak pernah diketik siapa pun dan tidak berasal dari aturan
  // mana pun.
  const harga = tersimpan >= minimum && tersimpan <= maksimum ? tersimpan : bawaan;

  const untung = harga - biayaBahan;
  const margin = harga > 0 ? (untung / harga) * 100 : 0;
  const status = statusDariMargin(margin, untung);
  const warna = warnaStatus(status);

  // Di ojol, yang benar-benar masuk ke laci sudah dipotong komisi lebih dulu.
  const komisiSah = komisi > 0 && komisi < 100;
  const diterimaOjol = komisiSah ? Math.round(harga * (1 - komisi / 100)) : harga;
  const untungOjol = diterimaOjol - biayaBahan;

  const posisi = (nilai: number) =>
    Math.min(100, Math.max(0, ((nilai - minimum) / (maksimum - minimum)) * 100));

  return (
    <div
      className="px-4 py-4 sm:px-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <p className="label-kecil" style={{ color: "var(--ink-dim)" }}>
        Coba geser harganya
      </p>
      <p className="teks-rapi mt-1.5 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        Bukan untuk mencari angka yang enak dilihat, tapi untuk tahu berapa yang ikut hilang
        tiap Rp 500 diturunkan — dan di titik mana untungnya jadi terlalu tipis.
      </p>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {/* 20px — tingkat paling bawah dari tiga blok berangka di halaman ini.
         *
         * Sebelumnya 34px, dan itu menjadikan angka coba-coba sebagai teks
         * terbesar di seluruh halaman: lebih besar daripada harga yang
         * benar-benar disarankan. Di layar 360px ukuran relatif adalah
         * satu-satunya penanda mana yang lebih penting, jadi urutannya harus
         * jawaban (28) → akibat (24) → coba-coba (20). */}
        <p className="judul tabular text-xl" style={{ color: warna }}>
          {formatRupiah(harga)}
        </p>
        <p className="tabular text-base font-semibold" style={{ color: warna }}>
          untung {formatRupiah(untung)} · {formatPersen(margin)}
        </p>
      </div>

      {/* Penanda tetap — inilah yang membedakan alat ini dari penggeser biasa:
       * posisinya selalu terbaca relatif terhadap dua angka yang berasal dari
       * aturan, bukan dari selera.
       *
       * Ditumpuk sebagai TIGA baris terpisah (garis · penggeser · nama), bukan
       * ditempel di atas penggesernya dengan jarak yang dihitung sendiri.
       * Sebelumnya penanda dipasang `absolute -top-1` lalu namanya didorong
       * `mt-8` — angka yang cocok hanya untuk satu tinggi kenop di satu
       * browser. Tinggi dan letak rel `input[type=range]` berbeda-beda antara
       * Safari, Chrome, dan Firefox, jadi penanda "balik modal" bisa berhenti
       * di atas harga yang bukan balik modal. Penanda yang menunjuk angka
       * salah lebih buruk daripada tidak ada penanda.
       *
       * Yang tersisa dihitung sendiri cuma posisi mendatar, dan itu memang
       * murni persentase dari rentang — tidak bergantung gaya bawaan browser.
       *
       * `px-2` di ketiga baris menyamakan tepi kiri-kanan dengan jangkauan
       * pusat kenop, yang tidak pernah benar-benar mencapai ujung rel. */}
      {(() => {
        const tanda = [
          { nilai: balikModal, label: "balik modal", warnaTanda: "var(--red)" },
          { nilai: hargaDisarankan, label: "disarankan", warnaTanda: "var(--blue-600)" },
        ].filter((t) => t.nilai >= minimum && t.nilai <= maksimum);

        return (
          <div className="mt-4">
            <div aria-hidden className="relative h-3 px-2">
              {tanda.map((t) => (
                <span
                  key={t.label}
                  className="absolute bottom-0 block h-3 w-0.5"
                  style={{
                    left: `${posisi(t.nilai)}%`,
                    transform: "translateX(-50%)",
                    background: t.warnaTanda,
                    opacity: 0.55,
                  }}
                />
              ))}
            </div>

            <div className="px-2">
              <input
                type="range"
                min={minimum}
                max={maksimum}
                step={KELIPATAN}
                value={harga}
                onChange={(event) => setHarga(Number(event.target.value))}
                aria-label="Harga jual di tempat"
                aria-valuetext={`${formatRupiah(harga)}, untung ${formatRupiah(untung)}, margin ${formatPersen(margin)}`}
                className="block w-full cursor-pointer"
                style={{ accentColor: warna, minHeight: "var(--tap)" }}
              />
            </div>

            <div aria-hidden className="relative h-4 px-2">
              {tanda.map((t) => (
                <span
                  key={t.label}
                  className="text-2xs absolute top-0 whitespace-nowrap"
                  style={{
                    left: `${posisi(t.nilai)}%`,
                    transform: "translateX(-50%)",
                    color: "var(--ink-soft)",
                  }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      <div
        className="text-2xs mt-1 flex justify-between px-2"
        style={{ color: "var(--ink-soft)" }}
      >
        <span className="tabular">{formatRupiah(minimum)}</span>
        <span className="tabular">{formatRupiah(maksimum)}</span>
      </div>

      <div
        className="mt-4 flex flex-col gap-1 pt-3"
        style={{ borderTop: "1px dotted var(--line-dotted)" }}
      >
        <p className="text-sm leading-relaxed">
          Di harga ini,{" "}
          {status === "RED" ? (
            <>
              untungnya <strong style={{ color: warna }}>terlalu tipis</strong> — sedikit saja
              harga bahan naik, menu ini rugi.
            </>
          ) : status === "YELLOW" ? (
            <>
              untungnya <strong style={{ color: warna }}>masih tipis</strong>, di bawah{" "}
              {AMBANG_MARGIN_SEHAT}%.
            </>
          ) : (
            <>
              untungnya <strong style={{ color: warna }}>sehat</strong>, di atas{" "}
              {AMBANG_MARGIN_SEHAT}%.
            </>
          )}
        </p>
        {komisiSah ? (
          <p className="tabular text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
            Kalau harga ini dipasang di ojol: diterima {formatRupiah(diterimaOjol)}, untung{" "}
            {formatRupiah(untungOjol)}
            {untungOjol <= 0 ? " — rugi" : ""}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
