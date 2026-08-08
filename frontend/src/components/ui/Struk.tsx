import type { ReactNode } from "react";

import { formatAngka } from "@/lib/format";

/**
 * Struk — elemen tanda tangan produk.
 *
 * Hasil analisa tampil sebagai struk warung: kertas hangat, kop kecil, garis
 * putus-putus, angka mono rata kanan, total bergaris oranye, dan tepi bawah
 * yang sobek bergerigi. Ini yang membuat produk terasa milik dunia warung,
 * bukan dashboard SaaS generik (PRD §4).
 *
 * Tepi geriginya digambar sebagai SVG, bukan mask CSS. Mask bergigi bergantung
 * pada dukungan `mask-image` yang masih belang-belang di WebView Android lama —
 * dan kalau gagal, yang muncul bukan tepi lurus melainkan struk yang hilang
 * separuh. SVG selalu tampil sama di mana pun.
 */

const JUMLAH_GIGI = 24;

function TepiSobek() {
  // Segitiga bergantian naik-turun sepanjang lebar struk.
  const titik: string[] = [];
  for (let i = 0; i < JUMLAH_GIGI; i += 1) {
    titik.push(`${((i + 0.5) / JUMLAH_GIGI) * 100},8`);
    titik.push(`${((i + 1) / JUMLAH_GIGI) * 100},0`);
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      className="block h-2 w-full"
      style={{ marginTop: -1 }}
    >
      <polygon points={`0,0 ${titik.join(" ")}`} fill="var(--paper)" />
    </svg>
  );
}

export function Struk({ children }: { children: ReactNode }) {
  return (
    // Bayangan dipasang sebagai drop-shadow di pembungkus, bukan box-shadow di
    // kertasnya, supaya bayangannya ikut mengikuti bentuk gerigi.
    <div
      className="animasi-masuk mx-auto w-full max-w-md"
      style={{ filter: "drop-shadow(0 10px 24px rgb(16 30 49 / 10%))" }}
    >
      <section
        className="px-5 pt-6 pb-5 sm:px-7"
        style={{
          background: "var(--paper)",
          borderRadius: "var(--radius) var(--radius) 0 0",
          borderTop: "3px solid var(--blue-800)",
        }}
      >
        <p
          aria-hidden
          className="label-kecil mb-4 text-center"
          style={{ color: "var(--ink-soft)" }}
        >
          Digify Laris · Hitung Untung Menu
        </p>
        {children}
      </section>
      <TepiSobek />
    </div>
  );
}

export function StrukJudul({ judul, subjudul }: { judul: string; subjudul?: string }) {
  return (
    <header className="text-center">
      <h3 className="judul-kecil text-xl sm:text-2xl">{judul}</h3>
      {subjudul ? (
        <p className="mt-1 text-sm" style={{ color: "var(--ink-dim)" }}>
          {subjudul}
        </p>
      ) : null}
    </header>
  );
}

export function StrukGaris() {
  return (
    <div aria-hidden className="my-4" style={{ borderTop: "2px dotted var(--line-dotted)" }} />
  );
}

/**
 * Satu baris struk. Label bisa membungkus ke baris berikutnya di layar 360px;
 * nilainya tidak pernah ikut menyusut supaya angka tetap terbaca.
 */
export function StrukBaris({
  label,
  nilai,
  keterangan,
}: {
  label: string;
  nilai: string;
  keterangan?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-sm leading-snug">{label}</p>
        {keterangan ? (
          <p className="text-xs leading-snug" style={{ color: "var(--ink-dim)" }}>
            {keterangan}
          </p>
        ) : null}
      </div>
      <p className="tabular shrink-0 text-sm font-semibold">{nilai}</p>
    </div>
  );
}

/**
 * Baris bahan: nama di kiri, takaran kecil di bawahnya, biaya rata kanan.
 *
 * Harga yang ditampilkan adalah HARGA BELANJA seperti yang ditulis pemiliknya
 * — "Rp 8.000/kg", bukan "Rp 8" per gram. Keduanya benar, tapi hanya yang
 * pertama yang pernah dia lihat di pasar. Baris struk harus bisa dicocokkan
 * langsung dengan nota belanja di tangannya; angka yang tidak dia kenali
 * membuat seluruh hitungan terasa tidak bisa dipercaya.
 */
export function StrukBarisBahan({
  nama,
  jumlah,
  satuan,
  hargaBeli,
  satuanBeli,
  biaya,
}: {
  nama: string;
  jumlah: number;
  satuan: string;
  hargaBeli: number;
  satuanBeli: string;
  biaya: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-sm leading-snug">{nama}</p>
        <p className="tabular text-xs" style={{ color: "var(--ink-dim)" }}>
          {formatAngka(jumlah)} {satuan} · Rp {formatAngka(hargaBeli)}/{satuanBeli}
        </p>
      </div>
      <p className="tabular shrink-0 text-sm">{biaya}</p>
    </div>
  );
}

/** Total — satu-satunya baris bergaris oranye. */
export function StrukTotal({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div
      className="mt-4 flex items-baseline justify-between gap-3 pt-3"
      style={{ borderTop: "2px solid var(--orange)" }}
    >
      <p className="text-base font-semibold">{label}</p>
      <p className="judul tabular text-2xl">{nilai}</p>
    </div>
  );
}

/** Catatan kaki struk, mis. tanggal atau nama warung. */
export function StrukCatatan({ children }: { children: ReactNode }) {
  return (
    <>
      <p
        className="teks-rapi mt-4 text-center text-xs leading-relaxed"
        style={{ color: "var(--ink-dim)" }}
      >
        {children}
      </p>
      {/* Barcode. Murni hiasan — tapi justru ini yang membuat blok tersebut
       * terbaca sebagai struk dalam sepersekian detik, sebelum satu angka pun
       * sempat dibaca. */}
      <div
        aria-hidden
        className="mt-4 h-8 w-full"
        style={{
          background:
            "repeating-linear-gradient(90deg, var(--ink) 0 2px, transparent 2px 4px, var(--ink) 4px 5px, transparent 5px 9px, var(--ink) 9px 12px, transparent 12px 14px)",
          opacity: 0.45,
        }}
      />
    </>
  );
}
