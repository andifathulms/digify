"use client";

import { useEffect, useState } from "react";

/**
 * Ajakan memasang aplikasi ke layar utama HP.
 *
 * Kenapa ini penting untuk produk ini, bukan sekadar gaya-gayaan: pembelinya
 * membuka aplikasi dari tautan WhatsApp. Tautan itu tenggelam dalam sehari.
 * Ikon di layar utama adalah satu-satunya cara ia menemukan lagi barang yang
 * sudah dibayarnya minggu lalu.
 *
 * Aturan yang dipegang:
 * - Hanya muncul kalau browser memang menawarkan pemasangan
 *   (`beforeinstallprompt`). Tidak ada instruksi mengambang untuk browser yang
 *   tidak mendukungnya.
 * - Sekali ditolak, tidak ditawarkan lagi. Ditandai di localStorage —
 *   menawarkan berulang kali adalah cara tercepat membuat orang benci sebuah
 *   aplikasi.
 */

type PeristiwaPasang = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KUNCI_TOLAK = "digify-pasang-ditolak";

export default function AjakanPasang() {
  const [peristiwa, setPeristiwa] = useState<PeristiwaPasang | null>(null);

  useEffect(() => {
    if (localStorage.getItem(KUNCI_TOLAK) === "ya") return;

    function tangkap(e: Event) {
      // Ditahan supaya browser tidak memunculkan bilahnya sendiri di waktu
      // yang tidak kita pilih.
      e.preventDefault();
      setPeristiwa(e as PeristiwaPasang);
    }

    window.addEventListener("beforeinstallprompt", tangkap);
    return () => window.removeEventListener("beforeinstallprompt", tangkap);
  }, []);

  if (!peristiwa) return null;

  function tolak() {
    localStorage.setItem(KUNCI_TOLAK, "ya");
    setPeristiwa(null);
  }

  async function pasang() {
    if (!peristiwa) return;
    await peristiwa.prompt();
    await peristiwa.userChoice;
    // Apa pun jawabannya, ajakan ini tidak muncul lagi: kalau dipasang tidak
    // perlu, kalau ditolak jangan diulang.
    localStorage.setItem(KUNCI_TOLAK, "ya");
    setPeristiwa(null);
  }

  return (
    <div
      className="animasi-masuk flex flex-wrap items-center gap-3 px-4 py-3.5"
      style={{
        background: "var(--orange-wash)",
        border: "1px solid var(--orange-100)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <p
        className="teks-rapi min-w-[12rem] flex-1 text-sm leading-relaxed"
        style={{ color: "var(--orange-600)" }}
      >
        <span className="font-semibold">Pasang di layar utama HP</span> supaya tidak perlu
        mencari tautannya lagi di WhatsApp.
      </p>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={tolak}
          className="cursor-pointer px-3 text-sm font-semibold"
          style={{ minHeight: "var(--tap)", color: "var(--ink-dim)" }}
        >
          Nanti saja
        </button>
        <button
          type="button"
          onClick={pasang}
          className="cursor-pointer px-4 text-sm font-semibold active:translate-y-px"
          style={{
            minHeight: "var(--tap)",
            background: "var(--grad-cta)",
            color: "var(--on-dark)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-cta)",
          }}
        >
          Pasang
        </button>
      </div>
    </div>
  );
}
