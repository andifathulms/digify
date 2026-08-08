"use client";

import { useState } from "react";

import { warnaStatus } from "@/components/ui/StatusPita";
import { AMBANG_MARGIN_SEHAT, statusDariMargin } from "@/lib/aturan";
import { formatPersen, formatRupiah } from "@/lib/format";

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
  const [harga, setHarga] = useState(bulatkanKeKelipatan(hargaDisarankan));

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
        <p className="judul tabular text-4xl" style={{ color: warna }}>
          {formatRupiah(harga)}
        </p>
        <p className="tabular text-base font-semibold" style={{ color: warna }}>
          untung {formatRupiah(untung)} · {formatPersen(margin)}
        </p>
      </div>

      {/* Rel dengan dua penanda tetap. Penanda inilah yang membedakan alat ini
       * dari penggeser biasa: posisinya selalu terbaca relatif terhadap dua
       * angka yang berasal dari aturan, bukan dari selera. */}
      <div className="relative mt-5 mb-2">
        {[
          { nilai: balikModal, label: "balik modal", warnaTanda: "var(--red)" },
          { nilai: hargaDisarankan, label: "disarankan", warnaTanda: "var(--blue-600)" },
        ]
          .filter((tanda) => tanda.nilai >= minimum && tanda.nilai <= maksimum)
          .map((tanda) => (
            <div
              key={tanda.label}
              aria-hidden
              className="absolute -top-1 flex flex-col items-center"
              style={{ left: `${posisi(tanda.nilai)}%`, transform: "translateX(-50%)" }}
            >
              <span
                className="block h-3 w-0.5"
                style={{ background: tanda.warnaTanda, opacity: 0.55 }}
              />
              <span
                className="mt-8 text-2xs whitespace-nowrap"
                style={{ color: "var(--ink-soft)" }}
              >
                {tanda.label}
              </span>
            </div>
          ))}

        <input
          type="range"
          min={minimum}
          max={maksimum}
          step={KELIPATAN}
          value={harga}
          onChange={(event) => setHarga(Number(event.target.value))}
          aria-label="Harga jual di tempat"
          aria-valuetext={`${formatRupiah(harga)}, untung ${formatRupiah(untung)}, margin ${formatPersen(margin)}`}
          className="relative w-full cursor-pointer"
          style={{ accentColor: warna, minHeight: "var(--tap)" }}
        />
      </div>

      <div className="flex justify-between text-2xs" style={{ color: "var(--ink-soft)" }}>
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
