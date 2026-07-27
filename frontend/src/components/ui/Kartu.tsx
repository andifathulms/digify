import type { ReactNode } from "react";

/** Wadah standar untuk blok form dan blok hasil. */
export default function Kartu({
  judul,
  keterangan,
  children,
}: {
  judul?: string;
  keterangan?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="p-5 sm:p-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {judul ? (
        <header className="mb-4">
          <h2
            className="text-lg leading-snug font-semibold"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {judul}
          </h2>
          {keterangan ? (
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
              {keterangan}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/** Angka besar dengan label — dipakai untuk ringkasan hasil. */
export function AngkaSorot({
  label,
  nilai,
  keterangan,
  warna,
}: {
  label: string;
  nilai: string;
  keterangan?: string;
  warna?: string;
}) {
  return (
    <div
      className="rounded-[var(--radius)] px-4 py-3"
      style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
    >
      <p className="text-xs font-medium" style={{ color: "var(--ink-dim)" }}>
        {label}
      </p>
      <p
        className="tabular mt-1 text-2xl leading-tight font-semibold"
        style={{ fontFamily: "var(--font-fraunces)", color: warna ?? "var(--ink)" }}
      >
        {nilai}
      </p>
      {keterangan ? (
        <p className="mt-1 text-xs leading-snug" style={{ color: "var(--ink-dim)" }}>
          {keterangan}
        </p>
      ) : null}
    </div>
  );
}
