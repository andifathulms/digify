"use client";

import { LEBAR_SLIDE, TINGGI_SLIDE } from "@/components/carousel/warna";

/**
 * Ubah satu node slide jadi berkas PNG dan unduh.
 *
 * SKALA_TANGKAP — catatan penting, ada pertentangan di dokumen:
 *   CLAUDE.md §9.3 meminta node berukuran asli 1080×1350 LALU di-capture
 *   dengan `scale: 5`. Dua hal itu digabung menghasilkan PNG 5400×6750.
 *   Sementara PRD §9 Fase 3 menetapkan kriteria selesai: "PNG hasil download
 *   benar-benar 1080×1350".
 *
 *   Yang dipakai di sini adalah kriteria PRD, karena itu yang bisa diuji dan
 *   itu ukuran yang memang diminta Instagram. Node tetap dirender pada ukuran
 *   asli 1080×1350 (sesuai CLAUDE.md), sehingga teks tetap tajam tanpa perlu
 *   pembesaran. PNG 5400px berukuran beberapa megabita — berat diunduh dan
 *   dibagikan dari HP di koneksi lambat, padahal itu justru pengguna kita.
 *
 *   Kalau nanti Owner memang menginginkan PNG raksasa, ubah satu angka ini.
 *   Lihat docs/DECISIONS.md.
 */
const SKALA_TANGKAP = 1;

export async function unduhSlide(node: HTMLElement, namaBerkas: string): Promise<void> {
  // Impor saat dipakai: html2canvas-pro cukup besar dan hanya dibutuhkan
  // saat user benar-benar menekan tombol unduh.
  const { default: html2canvas } = await import("html2canvas-pro");

  // Tanpa ini, PNG bisa keluar memakai font cadangan karena Fraunces dan
  // Plus Jakarta Sans belum selesai dimuat saat canvas digambar.
  await document.fonts.ready;

  const canvas = await html2canvas(node, {
    scale: SKALA_TANGKAP,
    width: LEBAR_SLIDE,
    height: TINGGI_SLIDE,
    // Putih, bukan null. Latar transparan berisiko tampil hitam di beberapa
    // aplikasi galeri dan pengunggah media sosial.
    backgroundColor: "#FFFFFF",
    useCORS: true,
    logging: false,
  });

  const tautan = document.createElement("a");
  tautan.download = namaBerkas;
  tautan.href = canvas.toDataURL("image/png");
  tautan.click();
}

/** Ubah berkas foto dari HP jadi data URL.
 *
 * Data URL, bukan URL objek: html2canvas menggambar ulang <img> ke dalam
 * canvas, dan gambar dari origin lain (atau blob yang sudah dicabut) membuat
 * canvas ternoda sehingga toDataURL gagal — PNG-nya tidak jadi sama sekali.
 */
export function bacaFotoSebagaiDataUrl(berkas: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => selesai(String(pembaca.result));
    pembaca.onerror = () => gagal(new Error("Foto tidak bisa dibaca."));
    pembaca.readAsDataURL(berkas);
  });
}

export function namaBerkasSlide(namaMenu: string, nomor: number): string {
  const bersih = namaMenu
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${bersih || "carousel"}-slide-${nomor}.png`;
}
