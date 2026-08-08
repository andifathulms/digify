"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

/**
 * Pembungkus blok hasil — memindahkan fokus ke hasil begitu hasilnya datang.
 *
 * ── Masalah yang diperbaiki ────────────────────────────────────────────────
 * Sebelum ini, menekan "Hitung" lalu menunggu berakhir dengan senyap bagi
 * pemakai pembaca layar. Pesan tunggu memang diumumkan (role="status" di
 * Keadaan.tsx), tapi begitu selesai pesan itu dilepas dan struk muncul di
 * dalam wadah yang tidak diamati siapa pun. Fokus tetap tertinggal di tombol.
 * Tidak ada satu pun tanda bahwa jawabannya sudah ada, apalagi di mana.
 *
 * Itu berarti pekerjaan utama aplikasi ini — menjawab "berapa untung menu
 * saya" — tidak bisa dilaporkan sama sekali ke pemakai yang tidak melihat
 * layar. Sejak kerangka pemuatan diberi jeda 300ms, di Tab 1–6 wilayah
 * role="status" bahkan sering tidak sempat terpasang, jadi tidak ada apa pun
 * yang terucap dari awal sampai akhir.
 *
 * ── Kenapa memindahkan fokus, bukan membungkus hasil dengan role="status" ──
 * Wilayah live membacakan SELURUH isinya begitu berubah. Struk berisi sembilan
 * baris bahan akan terbaca sebagai satu gumpalan panjang yang tidak bisa
 * dijeda, dan pemakainya tidak bisa melompat ke bagian yang ia cari.
 * Memindahkan fokus ke pangkal hasil membuat pembaca layar mengumumkan judul
 * blok, lalu pemakainya membaca sendiri dengan kecepatannya.
 *
 * `tabIndex={-1}` supaya bisa difokuskan lewat kode tapi TIDAK ikut urutan
 * Tab — tidak ada perhentian keyboard baru yang muncul untuk siapa pun.
 * Cincin fokus tidak digambar karena `:focus-visible` memang tidak menyala
 * untuk fokus yang dipindahkan lewat kode, dan pemakai yang melihat layar
 * sudah tahu hasilnya datang: ia kelihatan.
 *
 * Komponen ini dipasang ulang tiap kali hitungan diulang — tab membungkusnya
 * di dalam `hasil && !sedangJalan`, jadi saat menghitung ulang ia dilepas
 * dulu. Karena itu efeknya cukup berjalan sekali saat terpasang.
 */
export default function BlokHasil({
  judul,
  children,
}: {
  /** Dibacakan pembaca layar saat fokus mendarat. Tidak tampil di layar. */
  judul: string;
  children: ReactNode;
}) {
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wadah.current?.focus();
  }, []);

  return (
    <div ref={wadah} tabIndex={-1} className="flex flex-col gap-5">
      <h2 className="sr-only">{judul}</h2>
      {children}
    </div>
  );
}
