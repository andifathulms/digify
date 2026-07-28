"use client";

import { useState } from "react";

import FormKonten, { type IsiFormKonten } from "@/components/tools/FormKonten";
import Button from "@/components/ui/Button";
import { FieldAngka } from "@/components/ui/Field";
import Kartu from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import TombolSalin from "@/components/ui/TombolSalin";
import { CONTOH_KEUNGGULAN, GAYA_BAHASA, MENU_MINUMAN, PLATFORM } from "@/lib/contoh";
import type { CarouselRequest, CarouselResponse } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";

/**
 * Tab 9 · Carousel (Teks).
 *
 * Memakai endpoint yang sama dengan Tab 10 (/api/carousel-content). Bedanya
 * hanya di penyajian: di sini teks dan petunjuk fotonya, di sana gambar jadi.
 */
export default function CarouselTeks() {
  const [isi, setIsi] = useState<IsiFormKonten>({
    namaMenu: MENU_MINUMAN,
    keunggulan: CONTOH_KEUNGGULAN,
    platform: PLATFORM[0],
    gaya: GAYA_BAHASA[0],
    infoPromo: "",
  });
  const [jumlahSlide, setJumlahSlide] = useState(4);

  const { hasil, sedangJalan, galat, jalankan } = useAnalisa<CarouselResponse, CarouselRequest>(
    "/carousel-content",
  );

  return (
    <>
      <Kartu
        judul="Susun alur carousel"
        keterangan="Tiap slide dapat teksnya sendiri plus petunjuk foto untuk Anda potret. Mau langsung jadi gambar? Pakai alat nomor 10."
      >
        <FormKonten isi={isi} onUbah={setIsi} />

        <div className="mt-4">
          <FieldAngka
            label="Berapa slide?"
            bantuan="Paling sedikit 3, paling banyak 10. Empat biasanya sudah cukup."
            nilai={jumlahSlide}
            onUbah={setJumlahSlide}
            satuan="slide"
          />
        </div>

        <div className="mt-4">
          <Button
            lebarPenuh
            ukuran="besar"
            memuat={sedangJalan}
            onClick={() => jalankan({ ...isi, jumlahSlide })}
          >
            {sedangJalan ? "Sedang menyusun…" : "Susun carousel"}
          </Button>
        </div>
      </Kartu>

      {sedangJalan ? <SedangMenghitung pesan="Sedang menyusun slide… bisa 10–30 detik." /> : null}
      {galat ? <PesanGagal pesan={galat} /> : null}

      {hasil && !sedangJalan ? (
        <>
          {hasil.ringkasan_konsep ? (
            <Kartu judul="Alur ceritanya">
              <p className="text-sm leading-relaxed">{hasil.ringkasan_konsep}</p>
            </Kartu>
          ) : null}

          {hasil.slides.map((slide) => (
            <Kartu key={slide.nomor_slide}>
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{ background: "var(--orange-wash)", color: "var(--orange-hover)" }}
                >
                  {slide.nomor_slide}
                </span>
                <div className="min-w-0 flex-1">
                  {slide.tipe_slide ? (
                    <p
                      className="text-xs font-semibold tracking-wide uppercase"
                      style={{ color: "var(--orange)" }}
                    >
                      {slide.tipe_slide}
                    </p>
                  ) : null}
                  <p className="mt-1 text-base leading-relaxed font-medium">{slide.teks_slide}</p>

                  {slide.petunjuk_foto ? (
                    <p
                      className="mt-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm leading-relaxed"
                      style={{ background: "var(--cream)", color: "var(--ink)" }}
                    >
                      <span className="font-semibold">Fotonya: </span>
                      {slide.petunjuk_foto}
                    </p>
                  ) : null}
                </div>
                <TombolSalin teks={slide.teks_slide} />
              </div>
            </Kartu>
          ))}

          <Kartu judul="Caption untuk postingannya">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed whitespace-pre-line">{hasil.caption_post}</p>
              <TombolSalin teks={hasil.caption_post} />
            </div>

            {hasil.hashtag_rekomendasi.length > 0 ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {hasil.hashtag_rekomendasi.map((tagar) => (
                    <span
                      key={tagar}
                      className="rounded-full px-3 py-1.5 text-sm"
                      style={{ background: "var(--blue-wash)", color: "var(--blue-deep)" }}
                    >
                      {tagar}
                    </span>
                  ))}
                </div>
                <div className="mt-3">
                  <TombolSalin
                    teks={hasil.hashtag_rekomendasi.join(" ")}
                    label="Salin semua hashtag"
                  />
                </div>
              </>
            ) : null}
          </Kartu>
        </>
      ) : null}
    </>
  );
}
