"use client";

import { LEBAR_SLIDE, TINGGI_SLIDE, WARNA } from "@/components/carousel/warna";
import type { SlideCarousel } from "@/lib/types/api";

/**
 * Satu slide carousel, dirender pada ukuran ASLI 1080×1350.
 *
 * Node-nya benar-benar sebesar itu di DOM (CLAUDE.md §9.3) — yang dikecilkan
 * hanya tampilannya, lewat `transform: scale()` di komponen pemanggil. Kalau
 * node-nya sendiri dikecilkan, teks ikut mengecil dan hasil PNG-nya buram.
 *
 * Gaya C: kartu putih, garis biru di atas, label oranye. Slide terakhir
 * otomatis jadi slide ajakan berwarna biru penuh.
 *
 * Seluruh warna dan ukuran ditulis sebagai nilai literal, bukan class
 * Tailwind — lihat warna.ts untuk alasannya.
 */

/** Ikon kamera untuk slide yang belum diberi foto. Inline SVG supaya ikut
 *  ter-capture; ikon dari file eksternal berisiko belum ter-load saat capture. */
function IkonKamera() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 24 24"
      fill="none"
      stroke={WARNA.tintaRedup}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export type SlideProps = {
  slide: SlideCarousel;
  /** Foto pilihan user sebagai data URL. Data URL, bukan URL biasa, supaya
   *  canvas tidak ternoda oleh gambar lintas-origin dan gagal di-export. */
  foto: string | null;
  namaWarung: string;
  /** Slide penutup dirender sebagai kartu biru penuh. */
  slidePenutup: boolean;
};

export default function SlideRenderer({
  slide,
  foto,
  namaWarung,
  slidePenutup,
}: SlideProps) {
  const latar = slidePenutup ? WARNA.biruDeep : WARNA.putih;
  const warnaTeks = slidePenutup ? WARNA.putih : WARNA.tinta;

  return (
    <div
      style={{
        width: LEBAR_SLIDE,
        height: TINGGI_SLIDE,
        background: latar,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "var(--font-jakarta), sans-serif",
      }}
    >
      {/* Garis biru di atas — penanda Gaya C. Di slide penutup diganti oranye
          supaya tetap terlihat di atas latar biru. */}
      <div
        style={{
          height: 18,
          width: "100%",
          background: slidePenutup ? WARNA.oranye : WARNA.biru,
          flexShrink: 0,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px 64px",
          minHeight: 0,
        }}
      >
        {slide.tipe_slide ? (
          <p
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: slidePenutup ? WARNA.biruLight : WARNA.oranye,
            }}
          >
            {slide.tipe_slide}
          </p>
        ) : null}

        <p
          style={{
            margin: "28px 0 0",
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: slide.teks_slide.length > 90 ? 62 : 78,
            lineHeight: 1.15,
            fontWeight: 700,
            color: warnaTeks,
          }}
        >
          {slide.teks_slide}
        </p>

        {/* Area foto. Kalau user melewatkan unggahan, yang tampil adalah blok
            krem berikon — BUKAN teks petunjuk_foto. Petunjuk itu arahan untuk
            pemilik warung, bukan bagian dari konten yang diposting
            (API_CONTRACT.md §9). */}
        <div
          style={{
            marginTop: 48,
            flex: 1,
            minHeight: 0,
            borderRadius: 28,
            overflow: "hidden",
            background: slidePenutup ? "rgba(255,255,255,0.10)" : WARNA.krem,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {foto ? (
            /* next/image memakai proxy pengoptimal dan lazy loading;
               html2canvas butuh <img> polos berisi data URL supaya gambarnya
               sudah ada di DOM dan bisa digambar ulang ke canvas. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foto}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <IkonKamera />
          )}
        </div>

        <div
          style={{
            marginTop: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 30,
              fontWeight: 600,
              color: slidePenutup ? WARNA.putih : WARNA.tintaRedup,
            }}
          >
            {namaWarung}
          </p>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: slidePenutup ? WARNA.biruDeep : WARNA.putih,
              background: slidePenutup ? WARNA.putih : WARNA.biru,
              borderRadius: 999,
              padding: "10px 28px",
              fontFamily: "var(--font-plex-mono), monospace",
            }}
          >
            {slide.nomor_slide}
          </span>
        </div>
      </div>
    </div>
  );
}
