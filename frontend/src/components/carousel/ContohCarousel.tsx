"use client";

import KotakPratinjau from "@/components/carousel/KotakPratinjau";
import SlideRenderer from "@/components/carousel/SlideRenderer";
import Kartu from "@/components/ui/Kartu";
import { CONTOH_SLIDE_CAROUSEL, NAMA_WARUNG } from "@/lib/contoh";

/**
 * Deretan contoh slide yang sudah jadi, ditaruh DI ATAS form Tab 10.
 *
 * ── Kenapa ada ────────────────────────────────────────────────────────────
 * Tab 10 adalah satu-satunya alat yang keluarannya berupa berkas, dan itu
 * yang membuatnya berbeda dari sekadar alat analisa. Tapi sampai tombolnya
 * ditekan dan 10–30 detik berlalu, "gambar siap posting" cuma janji di dalam
 * kalimat — orang diminta menunggu untuk sesuatu yang belum pernah ia lihat
 * wujudnya. Yang paling sering terjadi: ia tidak menunggu.
 *
 * Jadi contohnya ditaruh sebelum form, bukan sesudah hasil.
 *
 * ── Kenapa terbuka, bukan dilipat ─────────────────────────────────────────
 * Berbeda dari ContohTerpandu di Tab 1, yang menerangkan CARA sebuah angka
 * dihitung dan wajar dilipat setelah dipahami sekali. Yang ini bukan
 * penjelasan, melainkan barang jadinya sendiri. Dilipat berarti kembali jadi
 * janji di dalam kalimat, persis masalah yang mau diselesaikan.
 *
 * Dirender kecil dan berjajar supaya terbaca sebagai "satu set carousel",
 * bukan satu gambar. Di HP deretannya digeser mendatar — itu gerakan yang
 * sama dengan menggeser carousel di Instagram, jadi tidak perlu diajarkan.
 */

/** Lebar satu contoh. Cukup untuk membaca susunannya, bukan untuk membaca teksnya. */
const LEBAR_CONTOH = 148;

export default function ContohCarousel() {
  return (
    <Kartu
      judul="Contoh hasil jadinya"
      keterangan="Seperti inilah gambar yang Anda unduh nanti — empat slide berukuran 1080×1350, sudah didesain, tinggal diposting."
    >
      {/* Digeser sampai ke tepi kartu supaya jelas deretannya masih berlanjut.
          Lebar strip = lebar isi kartu + padding kiri-kanan, jadi persis
          selebar kartunya sendiri dan halaman tidak ikut bisa digeser. */}
      <div
        className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:-mx-6 sm:px-6"
        role="list"
        aria-label={`Contoh ${CONTOH_SLIDE_CAROUSEL.length} slide carousel`}
      >
        {CONTOH_SLIDE_CAROUSEL.map((slide, indeks) => {
          const slidePenutup = indeks === CONTOH_SLIDE_CAROUSEL.length - 1;

          return (
            <div
              key={slide.nomor_slide}
              role="listitem"
              className="shrink-0 snap-start"
              style={{ width: LEBAR_CONTOH }}
            >
              <KotakPratinjau lebarMaks={LEBAR_CONTOH}>
                <SlideRenderer
                  slide={slide}
                  foto={null}
                  namaWarung={NAMA_WARUNG}
                  slidePenutup={slidePenutup}
                />
              </KotakPratinjau>
              <p className="mt-2 text-xs" style={{ color: "var(--ink-soft)" }}>
                Slide {slide.nomor_slide}
                {slidePenutup ? " · penutup" : ""}
              </p>
            </div>
          );
        })}
      </div>

      {/* Kotak krem di tiap contoh adalah lubang yang paling sering
          disalahpahami: orang mengiranya gambar yang gagal dimuat, atau
          mengira foto masakannya akan dibuatkan. Diterangkan di sini, di
          sebelah benda yang dimaksud, bukan di bagian bantuan. */}
      <p
        className="teks-rapi mt-4 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm leading-relaxed"
        style={{ background: "var(--cream)", borderLeft: "3px solid var(--orange-200)" }}
      >
        <span className="font-semibold">Kotak krem itu tempat foto Anda. </span>
        Unggah foto masakan warung sendiri dan ia langsung terpasang di situ. Kalau dilewat, slide
        tetap bisa diposting seperti contoh ini.
      </p>
    </Kartu>
  );
}
