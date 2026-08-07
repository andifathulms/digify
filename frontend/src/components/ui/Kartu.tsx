import type { ReactNode } from "react";

/**
 * Wadah standar untuk blok form dan blok hasil.
 *
 * Judul kartu diberi penanda garis oranye pendek di atasnya. Di layar 360px,
 * satu halaman alat bisa berisi tiga kartu beruntun; tanpa penanda visual
 * seperti ini semuanya membaur jadi satu kolom putih panjang dan user
 * kehilangan batas "form berakhir di sini, hasil mulai di sini".
 */
export default function Kartu({
  judul,
  keterangan,
  aksi,
  nada = "polos",
  children,
}: {
  judul?: string;
  keterangan?: string;
  /** Tombol kecil di kanan judul, mis. "Salin semua". */
  aksi?: ReactNode;
  /** "sorot" dipakai untuk kartu hasil utama supaya menonjol dari kartu form. */
  nada?: "polos" | "sorot";
  children: ReactNode;
}) {
  const disorot = nada === "sorot";

  return (
    <section
      className="p-5 sm:p-6"
      style={{
        background: "var(--surface)",
        border: `1px solid ${disorot ? "var(--blue-200)" : "var(--line)"}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: disorot ? "var(--shadow)" : "var(--shadow-sm)",
      }}
    >
      {judul ? (
        <header className="mb-5">
          <span
            aria-hidden
            className="mb-3 block h-1 w-9 rounded-full"
            style={{ background: disorot ? "var(--blue-500)" : "var(--orange)" }}
          />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="judul-kecil text-lg sm:text-xl">{judul}</h2>
            {aksi}
          </div>
          {keterangan ? (
            <p
              className="teks-rapi mt-2 text-sm leading-relaxed"
              style={{ color: "var(--ink-dim)" }}
            >
              {keterangan}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Angka besar dengan label — dipakai untuk ringkasan hasil.
 *
 * Warna hanya menyentuh angkanya dan satu garis tipis di kiri, tidak
 * seluruh latar. Kartu ringkasan berlatar hijau/merah penuh membuat halaman
 * hasil terlihat seperti lampu lalu lintas dan menghapus peran oranye
 * sebagai satu-satunya warna aksi.
 */
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
  const aksen = warna ?? "var(--blue-500)";

  return (
    <div
      className="overflow-hidden px-4 py-3.5"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        borderLeft: `3px solid ${aksen}`,
        borderRadius: "var(--radius)",
      }}
    >
      <p className="label-kecil" style={{ color: "var(--ink-dim)" }}>
        {label}
      </p>
      <p
        className="judul tabular mt-1.5 text-3xl leading-none"
        style={{ color: warna ?? "var(--ink)" }}
      >
        {nilai}
      </p>
      {keterangan ? (
        <p className="mt-2 text-xs leading-snug" style={{ color: "var(--ink-dim)" }}>
          {keterangan}
        </p>
      ) : null}
    </div>
  );
}
