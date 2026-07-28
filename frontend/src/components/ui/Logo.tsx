/**
 * Lambang Digify Laris.
 *
 * Bentuknya struk dengan tepi bawah bergerigi dan garis naik di dalamnya —
 * dua hal yang persis dijanjikan produk ini: hitungan warung, lalu naik.
 * Digambar sebagai SVG inline, bukan berkas gambar, supaya ikut mewarisi
 * warna teks induknya dan tidak menambah satu permintaan jaringan lagi di
 * koneksi lambat.
 */
export default function Logo({ ukuran = 36 }: { ukuran?: number }) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center"
      style={{
        width: ukuran,
        height: ukuran,
        background: "var(--grad-panel)",
        borderRadius: Math.round(ukuran * 0.28),
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <svg
        width={Math.round(ukuran * 0.56)}
        height={Math.round(ukuran * 0.56)}
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* Badan struk, tepi bawah bergerigi. */}
        <path
          d="M5 3.5h14v14.2l-2.33 1.4-2.34-1.4-2.33 1.4-2.34-1.4-2.33 1.4L5 17.7V3.5Z"
          fill="#FFFFFF"
          fillOpacity="0.16"
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        {/* Garis yang naik — oranye, satu-satunya aksen. */}
        <path
          d="M8.2 13.6l2.6-2.9 2.2 1.9 3-3.6"
          stroke="#F2790C"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
