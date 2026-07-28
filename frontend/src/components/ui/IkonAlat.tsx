/**
 * Ikon per alat.
 *
 * Digambar sendiri sebagai SVG inline, bukan diambil dari pustaka ikon —
 * `CLAUDE.md` melarang menambah pustaka komponen, dan sepuluh ikon garis
 * sederhana tidak sepadan dengan satu dependensi baru plus bundel-nya.
 *
 * Semuanya memakai `currentColor`, jadi warnanya ikut induknya: biru di kartu
 * Mesin Profit, oranye di Mesin Growth, putih saat terpilih di sidebar.
 */

const JALUR: Record<string, React.ReactNode> = {
  // Struk — biaya menu
  "biaya-menu": (
    <>
      <path d="M6 3.5h12v15.6l-2 1.2-2-1.2-2 1.2-2-1.2-2 1.2V3.5Z" />
      <path d="M9 8h6M9 11.5h6M9 15h3" />
    </>
  ),
  // Label harga
  "harga-jual": (
    <>
      <path d="M3.8 12.6 11 5.4a2 2 0 0 1 1.4-.6h4.8a2 2 0 0 1 2 2v4.8a2 2 0 0 1-.6 1.4l-7.2 7.2a2 2 0 0 1-2.8 0l-4.8-4.8a2 2 0 0 1 0-2.8Z" />
      <path d="M15.5 8.5h.01" />
    </>
  ),
  // Podium — ranking
  ranking: (
    <>
      <path d="M4 20V13h5v7M9.5 20V8h5v12M15 20v-5h5v5" />
    </>
  ),
  // Penggeser — optimasi
  "optimasi-menu": (
    <>
      <path d="M4 7h11M18.5 7H20M4 12h4M11.5 12H20M4 17h9M16.5 17H20" />
      <circle cx="16.5" cy="7" r="2" />
      <circle cx="9.5" cy="12" r="2" />
      <circle cx="14.5" cy="17" r="2" />
    </>
  ),
  // Dokumen — laporan
  laporan: (
    <>
      <path d="M6 3.5h8l4 4v13H6v-17Z" />
      <path d="M14 3.5v4h4M9 13h6M9 16.5h4" />
    </>
  ),
  // Tempat sampah — waste
  waste: (
    <>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </>
  ),
  // Bola lampu — ide menu
  "ide-menu": (
    <>
      <path d="M9.5 18h5M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.1 1 1.8l.1.8h4.8l.1-.8c.1-.7.4-1.3 1-1.8A6 6 0 0 0 12 3Z" />
    </>
  ),
  // Balon percakapan — konten promosi
  "konten-promosi": (
    <>
      <path d="M4 5.5h16v11H9.5L5 20.5V16.5H4v-11Z" />
      <path d="M8 9h8M8 12.5h5" />
    </>
  ),
  // Lembar bertumpuk — carousel teks
  "carousel-teks": (
    <>
      <path d="M7.5 4.5h9v15h-9z" />
      <path d="M4 7v10M20 7v10" />
      <path d="M10 9h4M10 12.5h4" />
    </>
  ),
  // Gambar — carousel gambar
  "carousel-gambar": (
    <>
      <path d="M7.5 4.5h9v15h-9z" />
      <path d="M4 7v10M20 7v10" />
      <path d="M10 15.5l1.8-2.2 1.4 1.2 1.3-1.6" />
      <circle cx="11" cy="9" r="1" />
    </>
  ),
};

export default function IkonAlat({ slug, ukuran = 20 }: { slug: string; ukuran?: number }) {
  const jalur = JALUR[slug];
  if (!jalur) return null;

  return (
    <svg
      aria-hidden
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {jalur}
    </svg>
  );
}
