"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import DaftarAlat from "@/components/ui/DaftarAlat";

/**
 * Tombol "Semua alat" di HP, beserta lembar penuh yang dibukanya.
 *
 * Menggantikan baris sepuluh pil yang digeser horizontal. Baris pil itu punya
 * tiga cacat yang tidak bisa diperbaiki tanpa menggantinya:
 *   - alat 5 sampai 10 tidak pernah terlihat tanpa menggeser lebih dulu,
 *     jadi praktis tidak ditemukan;
 *   - menggeser horizontal di dalam halaman yang juga digeser vertikal sering
 *     salah tangkap, apalagi dengan jempol di HP besar;
 *   - ia memakan satu baris tetap di puncak layar padahal isinya hanya dipakai
 *     sesekali.
 *
 * Lembar ini muncul saat dibutuhkan, menampilkan kesepuluh alat sekaligus
 * tanpa geser sedikit pun, lalu hilang lagi.
 */
export default function LembarAlat({
  status,
  keluar,
}: {
  /** <StatusServer /> — Server Component, jadi dioper sebagai anak, bukan
   *  di-import di sini (komponen ini "use client"). */
  status: ReactNode;
  keluar: ReactNode;
}) {
  const [terbuka, setTerbuka] = useState(false);
  // Portal baru boleh dipasang setelah komponen hidup di browser; di server
  // `document` tidak ada.
  const [dipasang, setDipasang] = useState(false);
  useEffect(() => setDipasang(true), []);

  // Esc menutup lembar, dan halaman di belakangnya dikunci supaya tidak ikut
  // bergulir saat jari menggeser di atas lembar.
  useEffect(() => {
    if (!terbuka) return;

    function padaTombol(peristiwa: KeyboardEvent) {
      if (peristiwa.key === "Escape") setTerbuka(false);
    }

    const gulirSemula = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", padaTombol);

    return () => {
      document.body.style.overflow = gulirSemula;
      window.removeEventListener("keydown", padaTombol);
    };
  }, [terbuka]);

  return (
    <>
      <button
        type="button"
        onClick={() => setTerbuka(true)}
        aria-expanded={terbuka}
        className="inline-flex shrink-0 cursor-pointer items-center gap-2 px-3.5 text-sm font-semibold whitespace-nowrap"
        style={{
          minHeight: "var(--tap)",
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-sm)",
          color: "var(--ink)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <svg
          aria-hidden
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M4 6.5h16M4 12h16M4 17.5h16" />
        </svg>
        Semua alat
      </button>

      {/*
       * Lembarnya dipasang lewat portal ke <body>, BUKAN di tempatnya berdiri.
       *
       * Tombol ini hidup di dalam bilah atas, dan bilah atas memakai
       * `backdrop-filter` supaya isi halaman terlihat buram di baliknya. Elemen
       * ber-filter menjadi containing block untuk keturunan `position: fixed` —
       * artinya `inset-0` di dalamnya bukan seukuran layar, melainkan seukuran
       * bilah atas setinggi 60px. Tanpa portal, lembar ini muncul terjepit di
       * puncak layar, bukan menutupi layar.
       */}
      {terbuka && dipasang
        ? createPortal(
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Tutup daftar alat"
            onClick={() => setTerbuka(false)}
            className="absolute inset-0 cursor-default"
            style={{ background: "rgb(16 30 49 / 45%)" }}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Daftar alat"
            className="animasi-masuk absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col"
            style={{
              background: "var(--bg)",
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              boxShadow: "var(--shadow-lg)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
              <span
                aria-hidden
                className="absolute inset-x-0 top-2 mx-auto h-1 w-10 rounded-full"
                style={{ background: "var(--line-strong)" }}
              />
              <h2 className="judul-kecil text-lg">Semua alat</h2>
              <button
                type="button"
                onClick={() => setTerbuka(false)}
                className="cursor-pointer px-3 text-sm font-semibold"
                style={{
                  minHeight: "var(--tap)",
                  color: "var(--ink-dim)",
                }}
              >
                Tutup
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3">
              <DaftarAlat onPilih={() => setTerbuka(false)} />
            </div>

            {/* Status server dan tombol keluar tinggal di sini, persis seperti
             * di kaki sidebar layar lebar. Di bilah atas HP keduanya tidak
             * muat bersama nama produk dan tombol "Semua alat" — dan keduanya
             * memang jarang ditekan. */}
            <div
              className="flex items-center justify-between gap-2 px-5 py-3"
              style={{ borderTop: "1px solid var(--line)" }}
            >
              {status}
              {keluar}
            </div>
          </div>
        </div>,
            document.body,
          )
        : null}
    </>
  );
}
