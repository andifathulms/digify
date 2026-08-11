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

/**
 * Galat yang pesannya memang untuk dibaca pemilik warung, bukan untuk log.
 * Pemanggil boleh menampilkan `.message` apa adanya.
 */
export class GalatFoto extends Error {}

/** Sisi terpanjang foto yang disimpan. Lihat `kecilkanFoto`. */
const SISI_MAKS = 1600;

/** Ubah berkas foto dari HP jadi data URL, mentah. */
function bacaBerkas(berkas: File): Promise<string> {
  return new Promise((selesai, gagal) => {
    const pembaca = new FileReader();
    pembaca.onload = () => selesai(String(pembaca.result));
    pembaca.onerror = () => gagal(new GalatFoto("Foto itu tidak bisa dibaca. Coba foto lain."));
    pembaca.readAsDataURL(berkas);
  });
}

/** Muat data URL jadi <img> yang sudah benar-benar ter-decode. */
function muatGambar(dataUrl: string): Promise<HTMLImageElement> {
  const gambar = new Image();
  gambar.src = dataUrl;
  return gambar.decode().then(() => gambar);
}

/** Apakah berkasnya berbau HEIC/HEIF — format bawaan kamera iPhone. */
function baunyaHeic(berkas: File): boolean {
  return /hei[cf]/i.test(berkas.type) || /\.hei[cf]$/i.test(berkas.name);
}

/**
 * Kecilkan foto yang jauh lebih besar dari yang dibutuhkan slide.
 *
 * Area foto pada slide hanya ~920px, sementara satu jepretan HP hari ini
 * gampang 4000px dan 8 MB. Foto sebesar itu disimpan sebagai data URL di
 * dalam keadaan React, dikali empat slide — cukup untuk membuat tab di HP
 * kelas menengah mati kehabisan memori, tepat setelah pemiliknya selesai
 * memilih foto keempat. Dikecilkan sekali di pintu masuk, semua yang di
 * belakangnya jadi ringan.
 */
function kecilkanFoto(gambar: HTMLImageElement, dataUrlAsli: string): string {
  const sisiTerpanjang = Math.max(gambar.naturalWidth, gambar.naturalHeight);
  if (sisiTerpanjang <= SISI_MAKS) return dataUrlAsli;

  const rasio = SISI_MAKS / sisiTerpanjang;
  const kanvas = document.createElement("canvas");
  kanvas.width = Math.round(gambar.naturalWidth * rasio);
  kanvas.height = Math.round(gambar.naturalHeight * rasio);

  const konteks = kanvas.getContext("2d");
  if (!konteks) return dataUrlAsli;

  konteks.drawImage(gambar, 0, 0, kanvas.width, kanvas.height);
  // JPEG, bukan PNG: ini foto, dan PNG hasil foto justru lebih besar dari
  // aslinya. Kualitas 0,85 tidak terlihat bedanya pada area sebesar ini.
  return kanvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Ubah berkas foto dari HP jadi data URL yang PASTI bisa digambar.
 *
 * Data URL, bukan URL objek: html2canvas menggambar ulang <img> ke dalam
 * canvas, dan gambar dari origin lain (atau blob yang sudah dicabut) membuat
 * canvas ternoda sehingga toDataURL gagal — PNG-nya tidak jadi sama sekali.
 *
 * ── Kenapa ada pemeriksaan decode ─────────────────────────────────────────
 * FileReader menerima berkas APA PUN, termasuk yang peramban tidak tahu cara
 * menggambarnya. Yang paling sering: foto HEIC bawaan iPhone. Dulu berkas
 * seperti itu lolos tanpa keluhan — <img>-nya kosong, html2canvas menggambar
 * kekosongan itu, dan yang diunduh adalah slide cantik dengan lubang di
 * tengahnya. Tidak ada pesan galat di mana pun, dan pemiliknya baru tahu
 * setelah gambarnya terlanjur diposting.
 *
 * Diperiksa dengan `decode()`, bukan dengan menebak dari nama berkas: Safari
 * BISA menggambar HEIC, jadi menolaknya berdasar ekstensi akan menolak foto
 * yang sebenarnya baik-baik saja di HP pemiliknya. Nama berkas hanya dipakai
 * untuk memilih kalimat setelah decode-nya benar-benar gagal.
 */
export async function bacaFotoSebagaiDataUrl(berkas: File): Promise<string> {
  if (berkas.type && !berkas.type.startsWith("image/")) {
    throw new GalatFoto("Berkas itu bukan foto. Pilih berkas gambar, misalnya JPG atau PNG.");
  }

  const dataUrl = await bacaBerkas(berkas);

  let gambar: HTMLImageElement;
  try {
    gambar = await muatGambar(dataUrl);
  } catch {
    throw new GalatFoto(
      baunyaHeic(berkas)
        ? "Foto ini format HEIC bawaan iPhone, dan peramban belum bisa membacanya. Buka fotonya di aplikasi Foto, pilih Bagikan lalu simpan sebagai JPG — atau kirim ke WhatsApp lalu simpan hasilnya, itu sudah jadi JPG."
        : "Foto itu tidak bisa dibaca. Coba pilih foto lain, atau simpan ulang sebagai JPG.",
    );
  }

  return kecilkanFoto(gambar, dataUrl);
}

export function namaBerkasSlide(namaMenu: string, nomor: number): string {
  const bersih = namaMenu
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${bersih || "carousel"}-slide-${nomor}.png`;
}
