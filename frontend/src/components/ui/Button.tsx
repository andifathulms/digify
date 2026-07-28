"use client";

import type { ReactNode } from "react";

/**
 * Tombol.
 *
 * Oranye HANYA untuk aksi utama. Kalau semua oranye, tidak ada yang menonjol
 * (CLAUDE.md §8). Tinggi minimum 44px untuk jempol, bukan kursor.
 *
 * Tiga hal ditangani di sini supaya tidak diulang di tiap pemanggil:
 * 1. Keadaan memuat punya spinner sendiri. Sebelumnya tombol hanya berganti
 *    teks jadi "Sedang menghitung…", dan pada koneksi lambat itu kurang
 *    terbaca sebagai "sedang jalan" — user menekannya lagi dan lagi.
 * 2. Umpan balik tekan (tombol turun satu piksel, warnanya menua sedikit).
 *    Di HP tidak ada hover; gerakan ini satu-satunya konfirmasi bahwa jempol
 *    mengenai sasaran.
 * 3. `aria-busy`, bukan sekadar `disabled`, supaya pembaca layar mengumumkan
 *    bahwa tombolnya sedang bekerja, bukan sedang mati.
 */

type Peran = "utama" | "kedua" | "halus" | "bahaya";
type Ukuran = "sedang" | "besar";

const GAYA: Record<Peran, React.CSSProperties> = {
  utama: {
    background: "var(--grad-cta)",
    color: "var(--on-dark)",
    border: "1px solid var(--orange-500)",
    boxShadow: "var(--shadow-cta)",
  },
  kedua: {
    background: "var(--surface)",
    color: "var(--ink)",
    border: "1px solid var(--line-strong)",
    boxShadow: "var(--shadow-xs)",
  },
  halus: {
    background: "transparent",
    color: "var(--blue-600)",
    border: "1px solid transparent",
  },
  bahaya: {
    background: "var(--red-wash)",
    color: "var(--red)",
    border: "1px solid transparent",
  },
};

const UKURAN: Record<Ukuran, { padding: string; kelasTeks: string; tinggi: string }> = {
  sedang: { padding: "0 1.25rem", kelasTeks: "text-[0.9375rem]", tinggi: "var(--tap)" },
  besar: { padding: "0 1.75rem", kelasTeks: "text-base", tinggi: "52px" },
};

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current"
      style={{ borderTopColor: "transparent" }}
    />
  );
}

export default function Button({
  children,
  onClick,
  peran = "utama",
  ukuran = "sedang",
  type = "button",
  nonaktif = false,
  memuat = false,
  lebarPenuh = false,
  ikon,
}: {
  children: ReactNode;
  onClick?: () => void;
  peran?: Peran;
  ukuran?: Ukuran;
  type?: "button" | "submit";
  nonaktif?: boolean;
  memuat?: boolean;
  lebarPenuh?: boolean;
  ikon?: ReactNode;
}) {
  const terkunci = nonaktif || memuat;
  const ukur = UKURAN[ukuran];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={terkunci}
      aria-busy={memuat || undefined}
      className={`inline-flex items-center justify-center gap-2 font-semibold ${ukur.kelasTeks} ${
        lebarPenuh ? "w-full" : ""
      } ${
        terkunci
          ? "cursor-not-allowed opacity-65"
          : "cursor-pointer active:translate-y-px active:brightness-95"
      }`}
      style={{
        ...GAYA[peran],
        minHeight: ukur.tinggi,
        padding: ukur.padding,
        borderRadius: "var(--radius-sm)",
        transition:
          "transform var(--dur-cepat) var(--ease), filter var(--dur-cepat) var(--ease), opacity var(--dur) var(--ease)",
      }}
    >
      {memuat ? <Spinner /> : ikon}
      {children}
    </button>
  );
}
