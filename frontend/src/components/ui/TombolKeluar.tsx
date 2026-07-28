"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TombolKeluar() {
  const router = useRouter();
  const [sedangKeluar, setSedangKeluar] = useState(false);

  async function keluar() {
    setSedangKeluar(true);
    try {
      await fetch("/api/auth/keluar", { method: "POST" });
    } finally {
      // Apa pun hasilnya, bawa user ke halaman masuk. Membiarkannya di halaman
      // alat setelah menekan "Keluar" jauh lebih membingungkan daripada
      // sekadar keluar tanpa pesan.
      router.push("/masuk");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={keluar}
      disabled={sedangKeluar}
      className="cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm"
      style={{
        border: "1px solid var(--line-strong)",
        background: "var(--surface)",
        color: "var(--ink-dim)",
        transition: "color var(--dur) var(--ease), border-color var(--dur) var(--ease)",
      }}
    >
      {sedangKeluar ? "Keluar…" : "Keluar"}
    </button>
  );
}
