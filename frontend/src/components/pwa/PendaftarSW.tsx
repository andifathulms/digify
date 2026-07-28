"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan service worker.
 *
 * Dijalankan setelah halaman selesai dimuat, bukan saat itu juga: mendaftar
 * lebih awal ikut berebut jalur jaringan dengan isi halaman yang justru
 * sedang ditunggu user.
 *
 * Di dev, service worker sengaja tidak didaftarkan dan yang sudah terlanjur
 * terpasang malah dicopot. Service worker yang menahan berkas statis di
 * localhost membuat perubahan kode terlihat tidak berpengaruh, dan itu
 * membuang waktu berjam-jam untuk mencari penyebab yang salah.
 */
export default function PendaftarSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker.getRegistrations().then((daftar) => {
        daftar.forEach((pendaftaran) => pendaftaran.unregister());
      });
      return;
    }

    function daftarkan() {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Gagal mendaftar bukan hal yang perlu diberitahukan ke pemilik warung:
        // aplikasinya tetap jalan penuh, hanya tidak terpasang offline.
      });
    }

    if (document.readyState === "complete") daftarkan();
    else window.addEventListener("load", daftarkan, { once: true });
  }, []);

  return null;
}
