"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks } from "@/components/ui/Field";
import Kartu, { AngkaSorot } from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import SimpanStruk from "@/components/ui/SimpanStruk";
import { Struk, StrukCatatan, StrukGaris, StrukJudul, StrukTotal } from "@/components/ui/Struk";
import { CONTOH_BAHAN_WASTE } from "@/lib/contoh";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { BahanWaste, WasteRequest, WasteResponse } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";

/** Tab 6 · Waste Tracker. */
export default function WasteTracker() {
  const [periode, setPeriode] = useState("Minggu ini");
  const [bahan, setBahan] = useState<BahanWaste[]>(
    CONTOH_BAHAN_WASTE.map((baris) => ({ ...baris })),
  );

  const { hasil, sedangJalan, galat, jalankan } = useAnalisa<WasteResponse, WasteRequest>(
    "/waste-tracker",
  );

  function ubahBaris(indeks: number, perubahan: Partial<BahanWaste>) {
    setBahan(bahan.map((baris, i) => (i === indeks ? { ...baris, ...perubahan } : baris)));
  }

  return (
    <>
      <Kartu
        judul="Berapa rupiah yang terbuang?"
        keterangan="Isi bahan yang Anda beli dan berapa yang akhirnya terbuang. Bahan paling boros secara persen sering bukan bahan yang paling banyak membuang uang."
      >
        <FieldTeks label="Periode" nilai={periode} onUbah={setPeriode} />

        <div className="mt-4 flex flex-col gap-3">
          {bahan.map((baris, indeks) => (
            <div
              key={indeks}
              className="rounded-[var(--radius)] p-4"
              style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--ink-dim)" }}>
                  Bahan {indeks + 1}
                </span>
                {bahan.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setBahan(bahan.filter((_, i) => i !== indeks))}
                    className="px-2 py-1 text-xs font-semibold"
                    style={{ color: "var(--red)" }}
                  >
                    Hapus baris
                  </button>
                ) : null}
              </div>

              <div className="mt-2 flex flex-col gap-3">
                <FieldTeks
                  label="Nama bahan"
                  nilai={baris.nama}
                  onUbah={(nilai) => ubahBaris(indeks, { nama: nilai })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldAngka
                    label="Jumlah beli"
                    nilai={baris.jumlahBeli}
                    onUbah={(nilai) => ubahBaris(indeks, { jumlahBeli: nilai })}
                    satuan={baris.satuan}
                  />
                  <FieldAngka
                    label="Jumlah terbuang"
                    nilai={baris.jumlahTerbuang}
                    onUbah={(nilai) => ubahBaris(indeks, { jumlahTerbuang: nilai })}
                    satuan={baris.satuan}
                  />
                  <FieldTeks
                    label="Satuan"
                    nilai={baris.satuan}
                    onUbah={(nilai) => ubahBaris(indeks, { satuan: nilai })}
                  />
                  <FieldAngka
                    label={`Harga per ${baris.satuan || "satuan"}`}
                    nilai={baris.hargaSatuan}
                    onUbah={(nilai) => ubahBaris(indeks, { hargaSatuan: nilai })}
                    rupiah
                  />
                </div>
                <FieldTeks
                  label="Kenapa terbuang? (boleh dikosongkan)"
                  nilai={baris.penyebab}
                  onUbah={(nilai) => ubahBaris(indeks, { penyebab: nilai })}
                  placeholder="Misalnya: layu karena disimpan di suhu ruang"
                />
              </div>
            </div>
          ))}

          <Button
            peran="kedua"
            onClick={() =>
              setBahan([
                ...bahan,
                {
                  nama: "",
                  jumlahBeli: 0,
                  satuan: "gram",
                  hargaSatuan: 0,
                  jumlahTerbuang: 0,
                  penyebab: "",
                },
              ])
            }
          >
            + Tambah bahan
          </Button>
        </div>

        <div className="mt-4">
          <Button
            lebarPenuh
            ukuran="besar"
            memuat={sedangJalan}
            onClick={() => jalankan({ periode, bahanList: bahan })}
          >
            {sedangJalan ? "Sedang menghitung…" : "Hitung pemborosan"}
          </Button>
        </div>
      </Kartu>

      {sedangJalan ? <SedangMenghitung /> : null}
      {galat ? <PesanGagal pesan={galat} /> : null}

      {hasil && !sedangJalan ? (
        <>
          {hasil.ringkasan_periode ? (
            <Kartu>
              <p className="text-sm leading-relaxed">{hasil.ringkasan_periode}</p>
            </Kartu>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Dua temuan ini sengaja ditampilkan berdampingan: sering bahan
                yang berbeda, dan itu justru inti gunanya alat ini. */}
            <AngkaSorot
              label="Paling boros dari sisi persentase"
              nilai={hasil.bahan_paling_boros_persen}
              keterangan="Paling banyak terbuang dibanding jumlah belinya"
              warna="var(--yellow)"
            />
            <AngkaSorot
              label="Paling boros dari sisi rupiah"
              nilai={hasil.bahan_paling_boros_rupiah}
              keterangan="Paling banyak membuang uang Anda"
              warna="var(--red)"
            />
          </div>

          <SimpanStruk judul={`Pemborosan ${periode}`}>
            <Struk>
              <StrukJudul judul="Rincian pemborosan" subjudul={periode} />
              <StrukGaris />

              {hasil.waste_breakdown.map((baris, indeks) => (
                <div key={`${baris.nama}-${indeks}`} className="py-2">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm">{baris.nama}</p>
                    <p className="tabular shrink-0 text-sm font-medium">
                      {formatRupiah(baris.nilai_rupiah)}
                    </p>
                  </div>
                  <p className="tabular text-xs" style={{ color: "var(--ink-dim)" }}>
                    terbuang {formatPersen(baris.persentase_terbuang)}
                  </p>
                  {baris.dugaan_penyebab ? (
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                      {baris.dugaan_penyebab}
                    </p>
                  ) : null}
                </div>
              ))}

              <StrukTotal
                label="Total terbuang"
                nilai={formatRupiah(hasil.total_nilai_waste_rupiah)}
              />
              <StrukCatatan>
                Sekitar {formatRupiah(hasil.total_nilai_waste_rupiah * 4)} sebulan kalau polanya
                sama terus.
              </StrukCatatan>
            </Struk>
          </SimpanStruk>

          {hasil.rekomendasi.length > 0 ? (
            <Kartu judul="Yang bisa Anda lakukan">
              <ul className="flex flex-col gap-2.5">
                {hasil.rekomendasi.map((saran, indeks) => (
                  <li key={indeks} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      aria-hidden
                      className="tabular mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ background: "var(--blue-wash)", color: "var(--blue-deep)" }}
                    >
                      {indeks + 1}
                    </span>
                    {saran}
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <AngkaSorot
                  label="Perkiraan hemat kalau dijalankan"
                  nilai={formatRupiah(hasil.estimasi_penghematan_bulanan)}
                  keterangan="per bulan"
                  warna="var(--green)"
                />
              </div>
            </Kartu>
          ) : null}
        </>
      ) : null}
    </>
  );
}
