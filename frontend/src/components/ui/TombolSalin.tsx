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
      className="shrink-0 cursor-pointer rounded-[var(--radius-sm)] px-3 py-2 text-xs font-semibold active:translate-y-px"
      style={{
        minHeight: "var(--tap)",
        background: tersalin ? "var(--green-wash)" : "var(--blue-wash)",
        color: tersalin ? "var(--green)" : "var(--blue-600)",
        border: `1px solid ${tersalin ? "var(--green)" : "var(--blue-100)"}`,
        transition: "background var(--dur) var(--ease), color var(--dur) var(--ease)",
      }}
    >
      {/* Centangnya dekoratif: pembaca layar sudah mengumumkan nama tombol
        * berubah jadi "Tersalin". Tanpa aria-hidden ia terbaca sebagai
        * "tanda centang" — bunyi tambahan yang tidak menambah apa pun. */}
      {tersalin ? (
        <>
          Tersalin<span aria-hidden> ✓</span>
        </>
      ) : (
        label
      )}
    </button>
  );
}
