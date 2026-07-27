"use client";

import type { ReactNode } from "react";

/**
 * Tombol.
 *
 * Oranye HANYA untuk aksi utama. Kalau semua oranye, tidak ada yang menonjol
 * (CLAUDE.md §8). Tinggi minimum 44px untuk jempol, bukan kursor.
 */

type Peran = "utama" | "kedua" | "halus";

const GAYA: Record<Peran, React.CSSProperties> = {
  utama: { background: "var(--orange)", color: "#FFFFFF", border: "1px solid var(--orange)" },
  kedua: {
    background: "var(--surface)",
    color: "var(--ink)",
    border: "1px solid var(--line)",
  },
  halus: { background: "transparent", color: "var(--blue)", border: "1px solid transparent" },
};

export default function Button({
  children,
  onClick,
  peran = "utama",
  type = "button",
  nonaktif = false,
  lebarPenuh = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  peran?: Peran;
  type?: "button" | "submit";
  nonaktif?: boolean;
  lebarPenuh?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={nonaktif}
      className={`inline-flex items-center justify-center gap-2 px-6 text-base font-semibold transition-opacity ${
        lebarPenuh ? "w-full" : ""
      } ${nonaktif ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      style={{
        ...GAYA[peran],
        minHeight: "var(--tap)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      {children}
    </button>
  );
}
