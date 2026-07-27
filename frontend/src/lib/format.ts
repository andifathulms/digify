/**
 * Format angka. Rupiah tidak punya sen di produk ini — selalu bulat.
 * Satu helper untuk seluruh aplikasi (CLAUDE.md §7).
 */

const formatterRupiah = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

/** 12500 → "Rp 12.500" */
export function formatRupiah(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined || Number.isNaN(nilai)) return "Rp 0";
  return `Rp ${formatterRupiah.format(Math.round(nilai))}`;
}

/** 12500 → "12.500" (tanpa prefix, untuk kolom angka di struk) */
export function formatAngka(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined || Number.isNaN(nilai)) return "0";
  return formatterRupiah.format(Math.round(nilai));
}

/** 64.5 → "64,5%" — koma desimal sesuai kebiasaan Indonesia. */
export function formatPersen(nilai: number | null | undefined): string {
  if (nilai === null || nilai === undefined || Number.isNaN(nilai)) return "0%";
  const dibulatkan = Math.round(nilai * 10) / 10;
  return `${dibulatkan.toString().replace(".", ",")}%`;
}

/** Ambil angka dari input yang diketik user ("Rp 12.500" → 12500). */
export function parseAngka(teks: string): number {
  const bersih = teks.replace(/[^\d]/g, "");
  return bersih === "" ? 0 : Number(bersih);
}

/** Tanggal hari ini dalam format yang dipakai form laporan: "28 Juli 2026". */
export function tanggalHariIni(): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}
