"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { LEBAR_SLIDE, TINGGI_SLIDE } from "@/components/carousel/warna";

/**
 * Kotak pratinjau slide yang ikut menyusut bersama layarnya.
 *
 * Slide dirender pada ukuran ASLI 1080×1350 (CLAUDE.md §9.3) lalu dikecilkan
 * secara visual dengan `transform: scale()`. Node sumbernya tetap berukuran
 * penuh, karena itu yang dibaca html2canvas.
 *
 * Lebarnya SELALU diukur, tidak pernah ditebak dari lebar layar dikurangi
 * padding: padding-nya berubah per breakpoint, dan angka yang ditebak akan
 * meleset lagi begitu tata letaknya disesuaikan. Sebelumnya lebarnya dipaku
 * 300px; di dalam `p-5` milik kartu dan `px-5` milik halaman, pada layar
 * selebar 320px hanya tersisa ~240px — dan karena kotaknya `overflow: hidden`,
 * sisi kanan tiap slide terpotong diam-diam alih-alih bisa digeser. Sama juga
 * saat halaman diperbesar 400%. (WCAG 1.4.10 Reflow.)
 *
 * Dipakai dua tempat dengan ukuran berbeda — papan slide hasil (besar, satu
 * per baris) dan deretan contoh (kecil, berjajar) — jadi lebar maksimumnya
 * ditentukan pemanggil.
 */

/** Lebar pratinjau paling besar kalau pemanggil tidak menentukan. */
export const LEBAR_PRATINJAU_MAKS = 300;

export default function KotakPratinjau({
  children,
  lebarMaks = LEBAR_PRATINJAU_MAKS,
  kelas = "",
}: {
  children: ReactNode;
  lebarMaks?: number;
  /** Kelas tata letak dari pemanggil, mis. penengah dan jarak atas. */
  kelas?: string;
}) {
  const kotak = useRef<HTMLDivElement>(null);
  const [lebar, setLebar] = useState(lebarMaks);

  useEffect(() => {
    const simpul = kotak.current;
    if (!simpul) return;
    const pengamat = new ResizeObserver((entri) => {
      const lebarBaru = entri[0]?.contentRect.width;
      if (lebarBaru) setLebar(lebarBaru);
    });
    pengamat.observe(simpul);
    return () => pengamat.disconnect();
  }, []);

  const skala = lebar / LEBAR_SLIDE;

  return (
    <div
      ref={kotak}
      className={`overflow-hidden ${kelas}`}
      style={{
        width: "100%",
        maxWidth: lebarMaks,
        height: TINGGI_SLIDE * skala,
        borderRadius: 12,
        border: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          transform: `scale(${skala})`,
          transformOrigin: "top left",
          width: LEBAR_SLIDE,
          height: TINGGI_SLIDE,
        }}
      >
        {children}
      </div>
    </div>
  );
}
