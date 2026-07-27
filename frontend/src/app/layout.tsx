import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

// display: swap — koneksi lambat tidak boleh membuat teks tak terlihat.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
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
