"use client";

import { useState } from "react";

import FormKonten, { type IsiFormKonten } from "@/components/tools/FormKonten";
import Button from "@/components/ui/Button";
import Kartu from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import TombolSalin from "@/components/ui/TombolSalin";
import { CONTOH_KEUNGGULAN, GAYA_BAHASA, MENU_MINUMAN, PLATFORM } from "@/lib/contoh";
import type { KontenPromosiRequest, KontenPromosiResponse } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";

/** Tab 8 · Konten Promosi. */
export default function KontenPromosi() {
  const [isi, setIsi] = useState<IsiFormKonten>({
    namaMenu: MENU_MINUMAN,
    keunggulan: CONTOH_KEUNGGULAN,
    platform: PLATFORM[0],
    gaya: GAYA_BAHASA[0],
    infoPromo: "",
  });

  const { hasil, sedangJalan, tampilkanTunggu, galat, jalankan } = useAnalisa<
    KontenPromosiResponse,
    KontenPromosiRequest
  >("/marketing-content");

  return (
    <>
      <Kartu
        judul="Buatkan caption promosinya"
        keterangan="Ditulis seperti pemilik warung yang menulis sendiri, bukan seperti iklan agensi."
      >
        <FormKonten isi={isi} onUbah={setIsi} />
        <div className="mt-4">
          <Button lebarPenuh
            ukuran="besar" memuat={sedangJalan} onClick={() => jalankan(isi)}>
            {sedangJalan ? "Sedang menulis…" : "Buatkan konten promosi"}
          </Button>
        </div>
      </Kartu>

      {tampilkanTunggu ? <SedangMenghitung pesan="Sedang menulis… bisa 10–30 detik." /> : null}
      {galat ? <PesanGagal pesan={galat} /> : null}

      {hasil && !sedangJalan ? (
        <>
          <Kartu judul="Caption utama">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed whitespace-pre-line">{hasil.caption_utama}</p>
              <TombolSalin teks={hasil.caption_utama} />
            </div>
          </Kartu>

          {hasil.caption_alternatif.length > 0 ? (
            <Kartu judul="Pilihan lain">
              <ul className="flex flex-col gap-3">
                {hasil.caption_alternatif.map((caption, indeks) => (
                  <li
                    key={indeks}
                    className="flex items-start justify-between gap-3 rounded-[var(--radius)] p-3"
                    style={{ background: "var(--bg)" }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">{caption}</p>
                    <TombolSalin teks={caption} />
                  </li>
                ))}
              </ul>
            </Kartu>
          ) : null}

          {hasil.hashtag_rekomendasi.length > 0 ? (
            <Kartu judul="Hashtag">
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
            </Kartu>
          ) : null}

          <Kartu judul="Cara memakainya">
            <dl className="flex flex-col gap-4">
              <div>
                <dt className="text-sm font-semibold">Foto atau video yang cocok</dt>
                <dd className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  {hasil.ide_visual}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold">Ajakan penutup</dt>
                <dd className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  {hasil.call_to_action}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold">Waktu posting yang pas</dt>
                <dd className="mt-1 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  {hasil.waktu_posting_ideal}
                </dd>
              </div>
            </dl>
          </Kartu>
        </>
      ) : null}
    </>
  );
}
