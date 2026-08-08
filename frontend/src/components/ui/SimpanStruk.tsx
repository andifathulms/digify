"use client";

import { useRef, useState } from "react";

import { namaBerkasStruk, simpanNodeSebagaiPng } from "@/lib/simpanGambar";

/**
 * Pembungkus struk yang bisa disimpan jadi gambar.
 *
 * Kenapa ini ada: hitungan yang paling sering perlu ditunjukkan ke orang lain
 * justru yang paling sulit dipindahkan. Pemilik warung mau menunjukkan biaya
 * per porsi ke pasangannya, ke rekan patungan, atau ke juru masaknya — dan
 * satu-satunya jalan sekarang adalah tangkapan layar, yang di HP selalu
 * terpotong bilah atas, bilah bawah, dan separuh struknya.
 *
 * Dibuat sebagai pembungkus, bukan prop di dalam `Struk`, karena `Struk`
 * dipakai juga dari tempat yang tidak butuh tombol ini — dan menambah hook ke
 * sana memaksa seluruh pemakainya jadi komponen klien.
 *
 * Tombolnya sengaja DI LUAR node yang ditangkap. Kalau di dalam, tombolnya
 * ikut tercetak di gambar.
 */
export default function SimpanStruk({
  judul,
  children,
}: {
  /** Dipakai untuk nama berkas, mis. nama menu. */
  judul: string;
  children: React.ReactNode;
}) {
  const wadah = useRef<HTMLDivElement>(null);
  const [sedang, setSedang] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function simpan() {
    if (!wadah.current || sedang) return;
    setSedang(true);
    setPesan(null);

    try {
      const hasil = await simpanNodeSebagaiPng(wadah.current, namaBerkasStruk(judul));
      setPesan(
        hasil === "dibagikan"
          ? "Gambar struk sudah siap dibagikan."
          : "Gambar struk tersimpan di perangkat Anda.",
      );
    } catch {
      // Pesannya tidak pernah menyebut html2canvas atau canvas — user tidak
      // bisa berbuat apa-apa dengan kata itu (CLAUDE.md §3.3).
      setPesan("Gambarnya belum berhasil dibuat. Coba lagi sebentar lagi ya.");
    } finally {
      setSedang(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Jarak dalam ikut tertangkap, jadi struk tidak menempel tepi gambar. */}
      <div ref={wadah} className="w-full px-3 pt-3 pb-1">
        {children}
      </div>

      <button
        type="button"
        onClick={simpan}
        disabled={sedang}
        aria-busy={sedang || undefined}
        className={`mt-3 inline-flex items-center justify-center gap-2 px-5 text-sm font-semibold ${
          sedang ? "cursor-not-allowed opacity-65" : "cursor-pointer active:translate-y-px"
        }`}
        style={{
          minHeight: "var(--tap)",
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-sm)",
          color: "var(--ink)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {sedang ? (
          <span
            aria-hidden
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current"
            style={{ borderTopColor: "transparent" }}
          />
        ) : (
          <svg
            aria-hidden
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 15V4M8.5 11.5 12 15l3.5-3.5" />
            <path d="M4.5 16v2.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V16" />
          </svg>
        )}
        {sedang ? "Menyiapkan gambar…" : "Simpan struk jadi gambar"}
      </button>

      {/* aria-live: hasilnya perlu diumumkan, karena di HP lembar berbagi
       * menutup layar dan tidak ada perubahan tampak setelah ia ditutup.
       *
       * Tingginya tidak dipesan di muka. `min-h-5` sebelumnya menyisakan 20px
       * kosong di bawah keempat struk sepanjang waktu, dan di layar 360px
       * ruang tegak yang paling mahal.
       *
       * Yang dimatikan saat kosong hanya jaraknya (`empty:mt-0`), BUKAN
       * elemennya. `display: none` akan mengeluarkan wadah ini dari pohon
       * aksesibilitas sebelum pesan pertama datang, dan sebagian pembaca layar
       * tidak mengumumkan wilayah live yang baru muncul bersama isinya.
       * Paragraf kosong sendiri tingginya nol. */}
      <p
        aria-live="polite"
        className="mt-2 text-sm empty:mt-0"
        style={{ color: "var(--ink-dim)" }}
      >
        {pesan}
      </p>
    </div>
  );
}
