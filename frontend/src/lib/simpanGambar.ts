"use client";

/**
 * Ubah satu node jadi PNG, lalu bagikan atau unduh.
 *
 * Dipakai untuk struk hasil hitungan. Berbeda dari `components/carousel/unduh.ts`
 * yang menangkap slide berukuran tetap 1080×1350 untuk Instagram; di sini
 * ukurannya mengikuti struk apa adanya di layar, tinggal diperbesar supaya
 * tetap tajam saat dizoom.
 *
 * SKALA 2 mengikuti alasan yang sama dengan keputusan ukuran PNG carousel
 * (docs/DECISIONS.md, 28 Juli): penggunanya di HP dengan koneksi lambat, dan
 * berkas beberapa megabita berat dibagikan. Struk selebar ~448px di layar
 * menjadi ~900px — cukup untuk dibaca dan dizoom, masih ringan dikirim.
 */

const SKALA = 2;

/** Warna kertas struk (--paper). Ditulis mentah HANYA di sini.
 *
 * html2canvas menggambar node ke atas kanvas kosong; kalau latarnya
 * transparan, sebagian aplikasi galeri dan pengunggah menampilkannya hitam.
 * Nilainya harus sama dengan --paper di styles/tokens.css. */
const LATAR_KERTAS = "#FDFBF7";

function keBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((selesai, gagal) => {
    canvas.toBlob(
      (blob) => (blob ? selesai(blob) : gagal(new Error("Gambar gagal dibuat."))),
      "image/png",
    );
  });
}

function unduhBlob(blob: Blob, namaBerkas: string): void {
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement("a");
  tautan.download = namaBerkas;
  tautan.href = url;
  tautan.click();
  // Dicabut setelah browser sempat memulai unduhan. Mencabutnya seketika
  // membatalkan unduhan di sebagian browser HP.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export type HasilSimpan = "dibagikan" | "diunduh";

/**
 * Tangkap node jadi PNG, lalu tawarkan lembar berbagi kalau ada — kalau tidak,
 * unduh biasa.
 *
 * Berbagi didahulukan karena tujuan gambar ini memang dikirim: ke pasangan,
 * ke rekan, ke grup WhatsApp. Menyimpan ke galeri lalu mencarinya lagi adalah
 * dua langkah tambahan di perangkat yang justru paling sering dipakai di sini.
 *
 * Sebagian browser HP menolak `navigator.share` kalau jarak dari ketukan
 * terlalu jauh — menangkap kanvas memakan waktu. Karena itu kegagalan apa pun
 * dari share jatuh ke unduhan biasa, bukan jadi pesan error: user tetap
 * mendapat gambarnya.
 */
export async function simpanNodeSebagaiPng(
  node: HTMLElement,
  namaBerkas: string,
): Promise<HasilSimpan> {
  const { default: html2canvas } = await import("html2canvas-pro");

  // Tanpa ini PNG bisa keluar memakai font cadangan — Fraunces dan Plus
  // Jakarta Sans belum tentu selesai dimuat saat kanvas digambar.
  await document.fonts.ready;

  const canvas = await html2canvas(node, {
    scale: SKALA,
    backgroundColor: LATAR_KERTAS,
    useCORS: true,
    logging: false,
  });

  const blob = await keBlob(canvas);
  const berkas = new File([blob], namaBerkas, { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [berkas] })) {
    try {
      await navigator.share({ files: [berkas] });
      return "dibagikan";
    } catch (galat) {
      // User menutup lembar berbagi — itu bukan kegagalan, dan tidak boleh
      // berubah jadi unduhan yang tidak dia minta.
      if (galat instanceof DOMException && galat.name === "AbortError") {
        return "dibagikan";
      }
    }
  }

  unduhBlob(blob, namaBerkas);
  return "diunduh";
}

/**
 * Nama berkas: nama menu + tanggal.
 *
 * Tanggalnya penting. Gambar struk beredar di WhatsApp jauh lebih lama
 * daripada masa berlaku angkanya — harga bahan berubah, strukmya tidak.
 * Tanggal di nama berkas adalah cara termurah menandai umurnya tanpa
 * mengubah apa yang tampil di layar (yang dilihat harus sama persis dengan
 * yang keluar).
 */
export function namaBerkasStruk(judul: string, tanggal: Date = new Date()): string {
  const bersih = judul
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const hari = [
    tanggal.getFullYear(),
    String(tanggal.getMonth() + 1).padStart(2, "0"),
    String(tanggal.getDate()).padStart(2, "0"),
  ].join("-");
  return `${bersih || "struk"}-${hari}.png`;
}
