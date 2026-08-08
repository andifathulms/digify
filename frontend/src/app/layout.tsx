import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import PendaftarSW from "@/components/pwa/PendaftarSW";

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
  title: "Digify Laris — Hitung Untung Menu Warung",
  description:
    "Hitung profit asli tiap menu warung Anda, lalu buat konten promosinya. Semua dalam Bahasa Indonesia.",
  manifest: "/manifest.webmanifest",
  applicationName: "Digify Laris",
  icons: {
    icon: [{ url: "/ikon/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/ikon/apple-touch-icon.png", sizes: "180x180" }],
  },
  // iOS tidak membaca manifest untuk urusan ini; nama aplikasi terpasang dan
  // gaya bilah statusnya hanya bisa diatur lewat meta apple-*.
  appleWebApp: {
    capable: true,
    title: "Digify Laris",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F4C97",
  // Dipakai penuh sampai tepi layar saat berjalan sebagai aplikasi terpasang.
  // Jarak amannya diurus sendiri lewat env(safe-area-inset-*) di rangka
  // aplikasi — kalau tidak, bilah atas tertutup poni dan isi bawah tertimpa
  // garis geser iPhone.
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${fraunces.variable} ${jakarta.variable} ${plexMono.variable}`}>
      <body>
        {children}
        <PendaftarSW />
      </body>
    </html>
  );
}
