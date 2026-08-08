"use client";

import { useRef, useState } from "react";

import SlideRenderer from "@/components/carousel/SlideRenderer";
import { bacaFotoSebagaiDataUrl, namaBerkasSlide, unduhSlide } from "@/components/carousel/unduh";
import { LEBAR_SLIDE, TINGGI_SLIDE } from "@/components/carousel/warna";
import Button from "@/components/ui/Button";
import { PesanGagal } from "@/components/ui/Keadaan";
import type { SlideCarousel } from "@/lib/types/api";

/**
 * Papan slide: pratinjau, unggah foto, dan unduh PNG per slide.
 *
 * Tiap slide dirender pada ukuran ASLI 1080×1350 lalu dikecilkan secara visual
 * dengan `transform: scale()`. Node sumbernya tetap berukuran penuh, karena
 * itu yang dibaca html2canvas (CLAUDE.md §9.3).
 */

/** Lebar pratinjau di layar. 300px muat di 360px dengan sisa ruang untuk padding. */
const LEBAR_PRATINJAU = 300;
const SKALA_PRATINJAU = LEBAR_PRATINJAU / LEBAR_SLIDE;

export default function PapanCarousel({
  slides,
  namaMenu,
  namaWarung,
}: {
  slides: SlideCarousel[];
  namaMenu: string;
  namaWarung: string;
}) {
  const [foto, setFoto] = useState<Record<number, string>>({});
  const [sedangUnduh, setSedangUnduh] = useState<number | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const nodeRef = useRef<Record<number, HTMLDivElement | null>>({});

  async function pilihFoto(nomor: number, berkas: File | undefined) {
    if (!berkas) return;
    setGalat(null);
    try {
      setFoto((sebelumnya) => ({ ...sebelumnya, [nomor]: "" }));
      const dataUrl = await bacaFotoSebagaiDataUrl(berkas);
      setFoto((sebelumnya) => ({ ...sebelumnya, [nomor]: dataUrl }));
    } catch {
      setFoto((sebelumnya) => {
        const salinan = { ...sebelumnya };
        delete salinan[nomor];
        return salinan;
      });
      setGalat("Foto itu tidak bisa dibaca. Coba pilih foto lain.");
    }
  }

  async function unduh(nomor: number) {
    const node = nodeRef.current[nomor];
    if (!node) return;

    setGalat(null);
    setSedangUnduh(nomor);
    try {
      await unduhSlide(node, namaBerkasSlide(namaMenu, nomor));
    } catch {
      setGalat("Gambarnya belum berhasil dibuat. Coba lagi sebentar lagi.");
    } finally {
      setSedangUnduh(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {galat ? <PesanGagal pesan={galat} /> : null}

      {slides.map((slide, indeks) => {
        // Slide terakhir otomatis jadi slide ajakan biru penuh
        // (API_CONTRACT.md §9, aturan render Tab 10).
        const slidePenutup = indeks === slides.length - 1;
        const adaFoto = Boolean(foto[slide.nomor_slide]);

        return (
          <section
            key={slide.nomor_slide}
            className="p-5"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <span
                  aria-hidden
                  className="tabular flex h-7 w-7 items-center justify-center rounded-[var(--radius-xs)] text-xs font-semibold"
                  style={{ background: "var(--grad-panel)", color: "var(--on-dark)" }}
                >
                  {slide.nomor_slide}
                </span>
                Slide {slide.nomor_slide} dari {slides.length}
                {slidePenutup ? " · penutup" : ""}
              </h3>
              {slide.tipe_slide ? (
                <span
                  className="label-kecil rounded-[var(--radius-pill)] px-2.5 py-1"
                  style={{ background: "var(--orange-wash)", color: "var(--orange-600)" }}
                >
                  {slide.tipe_slide}
                </span>
              ) : null}
            </div>

            {/* Kotak pratinjau: ukurannya hasil perkalian skala, supaya tidak
                menyisakan ruang kosong di bawah slide. */}
            <div
              className="mx-auto mt-4 overflow-hidden"
              style={{
                width: LEBAR_PRATINJAU,
                height: TINGGI_SLIDE * SKALA_PRATINJAU,
                maxWidth: "100%",
                borderRadius: 12,
                border: "1px solid var(--line)",
              }}
            >
              <div
                style={{
                  transform: `scale(${SKALA_PRATINJAU})`,
                  transformOrigin: "top left",
                  width: LEBAR_SLIDE,
                  height: TINGGI_SLIDE,
                }}
              >
                <SlideRenderer
                  slide={slide}
                  foto={foto[slide.nomor_slide] || null}
                  namaWarung={namaWarung}
                  slidePenutup={slidePenutup}
                />
              </div>
            </div>

            {/* Salinan untuk di-capture, dipasang di luar layar pada ukuran
                asli tanpa satu pun leluhur ber-transform.
                Ini bukan duplikasi yang bisa dihapus: html2canvas memakai
                posisi dan ukuran hasil layout, jadi `transform: scale()` pada
                elemen mana pun DI ATAS node yang di-capture ikut terhitung —
                isinya mengecil ke sudut kiri atas dan sisa kanvas jadi polos.
                Pada slide berlatar putih cacat ini tidak kelihatan sama sekali,
                dan itu justru yang membuatnya berbahaya. */}
            <div
              aria-hidden
              style={{
                position: "fixed",
                left: -20000,
                top: 0,
                width: LEBAR_SLIDE,
                height: TINGGI_SLIDE,
                pointerEvents: "none",
              }}
            >
              <div
                ref={(node) => {
                  nodeRef.current[slide.nomor_slide] = node;
                }}
                style={{ width: LEBAR_SLIDE, height: TINGGI_SLIDE }}
              >
                <SlideRenderer
                  slide={slide}
                  foto={foto[slide.nomor_slide] || null}
                  namaWarung={namaWarung}
                  slidePenutup={slidePenutup}
                />
              </div>
            </div>

            {slide.petunjuk_foto ? (
              <p
                className="teks-rapi mt-4 rounded-[var(--radius-sm)] px-3.5 py-2.5 text-sm leading-relaxed"
                style={{ background: "var(--cream)", borderLeft: "3px solid var(--orange-200)" }}
              >
                <span className="font-semibold">Saran fotonya: </span>
                {slide.petunjuk_foto}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <label
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] px-5 text-sm font-semibold"
                style={{
                  minHeight: "var(--tap-besar)",
                  background: adaFoto ? "var(--green-wash)" : "var(--surface)",
                  border: `1px solid ${adaFoto ? "var(--green)" : "var(--line-strong)"}`,
                  color: adaFoto ? "var(--green)" : "var(--ink)",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                {adaFoto ? `Ganti foto slide ${slide.nomor_slide}` : `Pilih foto slide ${slide.nomor_slide}`}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => pilihFoto(slide.nomor_slide, event.target.files?.[0])}
                />
              </label>

              <Button
                lebarPenuh
                memuat={sedangUnduh === slide.nomor_slide}
                onClick={() => unduh(slide.nomor_slide)}
              >
                {sedangUnduh === slide.nomor_slide
                  ? "Membuat gambar…"
                  : `Simpan slide ${slide.nomor_slide} (1080×1350)`}
              </Button>
            </div>

            {!adaFoto ? (
              <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                Tanpa foto pun slide ini sudah bisa diposting. Fotonya opsional.
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
