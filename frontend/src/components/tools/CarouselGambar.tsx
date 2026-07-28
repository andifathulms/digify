"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import FormKonten, { type IsiFormKonten } from "@/components/tools/FormKonten";
import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks } from "@/components/ui/Field";
import Kartu from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import TombolSalin from "@/components/ui/TombolSalin";
import {
  CONTOH_KEUNGGULAN,
  GAYA_BAHASA,
  MENU_MINUMAN,
  NAMA_WARUNG,
  PLATFORM,
} from "@/lib/contoh";
import type { CarouselRequest, CarouselResponse } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";

/**
 * Papan slide harus client-only: html2canvas menggambar ke <canvas>, dan
 * canvas tidak ada di server (CLAUDE.md §9.2).
 */
const PapanCarousel = dynamic(() => import("@/components/carousel/PapanCarousel"), {
  ssr: false,
  loading: () => (
    <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
      Menyiapkan gambar slide…
    </p>
  ),
});

/**
 * Tab 10 · Carousel (Gambar).
 *
 * Memakai endpoint yang SAMA dengan Tab 9 (/api/carousel-content). Yang
 * berbeda hanya penyajiannya: di sini payload-nya dirender jadi gambar jadi
 * yang bisa diunduh. Jangan pernah membuat endpoint kedua untuk ini.
 */
export default function CarouselGambar() {
  const [isi, setIsi] = useState<IsiFormKonten>({
    namaMenu: MENU_MINUMAN,
    keunggulan: CONTOH_KEUNGGULAN,
    platform: PLATFORM[0],
    gaya: GAYA_BAHASA[0],
    infoPromo: "",
  });
  const [jumlahSlide, setJumlahSlide] = useState(4);
  const [namaWarung, setNamaWarung] = useState(NAMA_WARUNG);

  const { hasil, sedangJalan, galat, jalankan } = useAnalisa<CarouselResponse, CarouselRequest>(
    "/carousel-content",
  );

  return (
    <>
      <Kartu
        judul="Bikin gambar carousel siap posting"
        keterangan="Hasilnya berupa gambar jadi ukuran 1080×1350 yang bisa langsung Anda unduh dan posting. Tidak perlu Canva."
      >
        <FormKonten isi={isi} onUbah={setIsi} />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FieldTeks
            label="Nama warung di slide"
            nilai={namaWarung}
            onUbah={setNamaWarung}
          />
          <FieldAngka
            label="Berapa slide?"
            bantuan="Slide terakhir otomatis jadi slide ajakan."
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
            {sedangJalan ? "Sedang membuat…" : "Buatkan gambar carousel"}
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

          <PapanCarousel
            slides={hasil.slides}
            namaMenu={isi.namaMenu}
            namaWarung={namaWarung}
          />

          <Kartu judul="Caption untuk postingannya">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed whitespace-pre-line">{hasil.caption_post}</p>
              <TombolSalin teks={hasil.caption_post} />
            </div>

            {hasil.hashtag_rekomendasi.length > 0 ? (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
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
              </div>
            ) : null}
          </Kartu>
        </>
      ) : null}
    </>
  );
}
