import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import "./globals.css";

/**
 * Font disertakan di dalam repo (src/fonts/), bukan diambil dari Google Fonts
 * saat build.
 *
 * Alasannya: `next/font/google` mengunduh berkas font pada saat `npm run build`.
 * Artinya deploy jadi bergantung pada layanan pihak ketiga — kalau Google
 * sedang tak terjangkau, atau VPS-nya ada di balik jaringan yang membatasi,
 * build GAGAL dan aplikasi tidak bisa naik sama sekali. Untuk produk yang
 * dideploy dari satu VPS, itu ketergantungan yang tidak sepadan.
 *
 * Berkasnya subset latin, dan variabel untuk Fraunces & Plus Jakarta Sans
 * (satu berkas untuk seluruh rentang berat). Total di bawah 130 KB.
 *
 * display: "swap" — koneksi lambat tidak boleh membuat teks tak terlihat.
 */

const fraunces = localFont({
  src: "../fonts/Fraunces.woff2",
  weight: "600 700",
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const jakarta = localFont({
  src: "../fonts/PlusJakartaSans.woff2",
  weight: "400 700",
  variable: "--font-jakarta",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const plexMono = localFont({
  src: [
    { path: "../fonts/IBMPlexMono-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/IBMPlexMono-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  fallback: ["ui-monospace", "monospace"],
});

export const metadata: Metadata = {
  title: "Digify Laris — Menu Optimizer",
  description:
    "Hitung profit asli tiap menu warung Anda, lalu buat konten promosinya. Semua dalam Bahasa Indonesia.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F4C97",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fraunces.variable} ${jakarta.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
