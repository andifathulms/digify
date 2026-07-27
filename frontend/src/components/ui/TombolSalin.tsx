"use client";

import { useEffect, useState } from "react";

/**
 * Tombol salin.
 *
 * Konten promosi dibuat untuk ditempel ke Instagram atau WhatsApp — memaksa
 * user memblok teks panjang dengan jempol di layar 360px adalah cara tercepat
 * membuat fitur ini tidak terpakai.
 */
export default function TombolSalin({ teks, label = "Salin" }: { teks: string; label?: string }) {
  const [tersalin, setTersalin] = useState(false);

  useEffect(() => {
    if (!tersalin) return;
    const jeda = setTimeout(() => setTersalin(false), 2000);
    return () => clearTimeout(jeda);
  }, [tersalin]);

  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
      setTersalin(true);
    } catch {
      // Sebagian browser lama menolak clipboard tanpa HTTPS. Diamkan saja —
      // user masih bisa blok manual, dan pesan galat di sini cuma bikin panik.
    }
  }

  return (
    <button
      type="button"
      onClick={salin}
      className="shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-xs font-semibold transition-colors"
      style={{
        minHeight: "36px",
        background: tersalin ? "var(--green-wash)" : "var(--blue-wash)",
        color: tersalin ? "var(--green)" : "var(--blue-deep)",
      }}
    >
      {tersalin ? "Tersalin ✓" : label}
    </button>
  );
}
