import type { ReactNode } from "react";

import { formatAngka } from "@/lib/format";

/**
 * Struk — elemen tanda tangan produk.
 *
 * Hasil analisa tampil sebagai struk warung: garis putus-putus, angka mono
 * rata kanan, total bergaris oranye. Ini yang membuat produk terasa milik
 * dunia warung, bukan dashboard SaaS generik (PRD §4).
 */

export function Struk({ children }: { children: ReactNode }) {
  return (
    <section
      className="mx-auto w-full max-w-md px-5 py-6 sm:px-7"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {children}
    </section>
  );
}

export function StrukJudul({ judul, subjudul }: { judul: string; subjudul?: string }) {
  return (
    <header className="text-center">
      <h3
        className="text-xl leading-snug font-semibold"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {judul}
      </h3>
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
    <div
      aria-hidden
      className="my-4"
      style={{ borderTop: "2px dotted var(--line-dotted)" }}
    />
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
          <p className="text-xs" style={{ color: "var(--ink-dim)" }}>
            {keterangan}
          </p>
        ) : null}
      </div>
      <p className="tabular shrink-0 text-sm font-medium">{nilai}</p>
    </div>
  );
}

/** Baris bahan: nama di kiri, jumlah kecil di bawahnya, biaya rata kanan. */
export function StrukBarisBahan({
  nama,
  jumlah,
  satuan,
  hargaSatuan,
  biaya,
}: {
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  biaya: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-sm leading-snug">{nama}</p>
        <p className="tabular text-xs" style={{ color: "var(--ink-dim)" }}>
          {formatAngka(jumlah)} {satuan} × Rp {formatAngka(hargaSatuan)}
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
      <p
        className="tabular text-xl font-semibold"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {nilai}
      </p>
    </div>
  );
}

/** Catatan kaki struk, mis. tanggal atau nama warung. */
export function StrukCatatan({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-center text-xs" style={{ color: "var(--ink-dim)" }}>
      {children}
    </p>
  );
}
