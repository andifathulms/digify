"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks, FieldTeksPanjang } from "@/components/ui/Field";
import Kartu, { AngkaSorot } from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import SimpanStruk from "@/components/ui/SimpanStruk";
import {
  Struk,
  StrukBarisBahan,
  StrukCatatan,
  StrukGaris,
  StrukJudul,
  StrukTotal,
} from "@/components/ui/Struk";
import { periksaBahanTerbaca } from "@/lib/bahanTerbaca";
import { CONTOH_BAHAN, MENU_UTAMA, NAMA_WARUNG } from "@/lib/contoh";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { BiayaMenuRequest, BiayaMenuResponse } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";

/**
 * Peringatan bahan yang tidak ikut terhitung.
 *
 * Muncul DI ATAS struk, bukan di bawahnya. Kalau biaya per porsi ternyata
 * kurang, itu harus diketahui sebelum angkanya dibaca — bukan sesudah
 * pemiliknya terlanjur memakainya untuk menetapkan harga.
 *
 * Nadanya sengaja bukan nada error: tidak ada yang rusak, dan tidak ada yang
 * salah diketik. Ini akibat wajar dari boleh menulis bebas, dan yang
 * dibutuhkan pemiliknya cuma tahu bahwa itu terjadi.
 */
function BahanTerlewat({
  teksBahan,
  namaTerbaca,
}: {
  teksBahan: string;
  namaTerbaca: string[];
}) {
  const bacaan = periksaBahanTerbaca(teksBahan, namaTerbaca);
  if (!bacaan.adaYangTerlewat) return null;

  return (
    <div
      className="animasi-masuk px-4 py-3.5"
      style={{
        background: "var(--yellow-wash)",
        border: "1px solid var(--line)",
        borderLeft: "4px solid var(--yellow)",
        borderRadius: "var(--radius)",
      }}
    >
      <p className="text-base font-semibold">
        {bacaan.jumlahTerbaca} dari {bacaan.jumlahDitulis} baris bahan yang terhitung
      </p>
      <p className="teks-rapi mt-1.5 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        Baris tanpa jumlah atau harga yang jelas tidak bisa dihitung, jadi biaya per porsi di
        bawah ini lebih rendah dari yang sebenarnya. Lengkapi barisnya, lalu hitung ulang.
      </p>

      {bacaan.barisTakDikenali.length > 0 ? (
        <>
          <p className="mt-3 text-sm font-semibold">Sepertinya baris ini:</p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {bacaan.barisTakDikenali.map((baris, indeks) => (
              <li
                key={`${baris}-${indeks}`}
                className="tabular px-2.5 py-1.5 text-sm"
                style={{ background: "var(--surface)", borderRadius: "var(--radius-xs)" }}
              >
                {baris}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm" style={{ color: "var(--ink-dim)" }}>
            Contoh baris yang terbaca: “Kecap manis 15 ml @ Rp 24.000/liter”.
          </p>
        </>
      ) : null}
    </div>
  );
}

/** Tab 1 · Biaya Menu. */
export default function BiayaMenu() {
  const [namaMenu, setNamaMenu] = useState(MENU_UTAMA);
  const [bahan, setBahan] = useState(CONTOH_BAHAN);
  const [beratPorsi, setBeratPorsi] = useState(350);
  const [hargaSekarang, setHargaSekarang] = useState(25000);

  const { hasil, sedangJalan, galat, jalankan } = useAnalisa<
    BiayaMenuResponse,
    BiayaMenuRequest
  >("/cost-calculator");

  return (
    <>
      <Kartu
        judul="Berapa biaya asli satu porsi?"
        keterangan="Tulis bahannya apa adanya, satu per baris. Tidak perlu rapi — biar kami yang mengurai jumlah dan harganya."
      >
        <div className="flex flex-col gap-4">
          <FieldTeks label="Nama menu" nilai={namaMenu} onUbah={setNamaMenu} />

          <FieldTeksPanjang
            label="Daftar bahan"
            bantuan="Takaran untuk SATU porsi, satu bahan per baris. Sebutkan jumlah dan harga belinya, contoh: Beras 150g @ Rp 8.000/kg"
            nilai={bahan}
            onUbah={setBahan}
            baris={9}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldAngka
              label="Berat per porsi"
              nilai={beratPorsi}
              onUbah={setBeratPorsi}
              satuan="gram"
            />
            <FieldAngka
              label="Harga jual sekarang"
              nilai={hargaSekarang}
              onUbah={setHargaSekarang}
              rupiah
            />
          </div>

          <Button
            lebarPenuh
            ukuran="besar"
            memuat={sedangJalan}
            onClick={() =>
              jalankan({
                itemName: namaMenu,
                ingredientsList: bahan,
                portionWeight: beratPorsi,
                currentPrice: hargaSekarang,
              })
            }
          >
            {sedangJalan ? "Sedang menghitung…" : "Hitung biaya menu"}
          </Button>
        </div>
      </Kartu>

      {sedangJalan ? <SedangMenghitung /> : null}
      {galat ? <PesanGagal pesan={galat} /> : null}

      {hasil && !sedangJalan ? (
        <>
          <BahanTerlewat
            teksBahan={bahan}
            namaTerbaca={hasil.ingredients_breakdown.map((baris) => baris.nama)}
          />

          <SimpanStruk judul={hasil.item_name}>
            <Struk>
              <StrukJudul judul={hasil.item_name} subjudul={`Biaya bahan untuk 1 porsi · ${NAMA_WARUNG}`} />
              <StrukGaris />

              {hasil.ingredients_breakdown.map((bahanBaris, indeks) => (
                <StrukBarisBahan
                  key={`${bahanBaris.nama}-${indeks}`}
                  nama={bahanBaris.nama}
                  jumlah={bahanBaris.jumlah}
                  satuan={bahanBaris.satuan}
                  hargaBeli={bahanBaris.harga_beli}
                  satuanBeli={bahanBaris.satuan_beli}
                  biaya={formatRupiah(bahanBaris.biaya)}
                />
              ))}

              <StrukTotal label="Biaya per porsi" nilai={formatRupiah(hasil.cogs_per_portion)} />
              <StrukCatatan>
                Dihitung dari harga bahan yang Anda tulis. Kalau harga bahan berubah, hitung ulang.
              </StrukCatatan>
            </Struk>
          </SimpanStruk>

          <Kartu judul="Artinya untuk warung Anda">
            <div className="grid gap-3 sm:grid-cols-2">
              <AngkaSorot
                label="Untung tiap porsi"
                nilai={formatRupiah(hargaSekarang - hasil.cogs_per_portion)}
                keterangan={`Margin ${formatPersen(hasil.current_margin_percentage)} di harga ${formatRupiah(hargaSekarang)}`}
                warna={
                  hargaSekarang - hasil.cogs_per_portion > 0 ? "var(--green)" : "var(--red)"
                }
              />
              <AngkaSorot
                label="Bahan terbuang"
                nilai={formatPersen(hasil.food_waste_percentage)}
                keterangan={`Sekitar ${formatRupiah((hasil.cogs_per_portion * hasil.food_waste_percentage) / 100)} per porsi ikut hilang`}
                warna={hasil.food_waste_percentage > 10 ? "var(--yellow)" : "var(--ink)"}
              />
            </div>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
              Sudah tahu biaya aslinya? Lanjut ke{" "}
              <a href="/alat/harga-jual" className="font-semibold" style={{ color: "var(--blue)" }}>
                Harga Jual
              </a>{" "}
              untuk mencari harga yang benar, termasuk untuk ojol.
            </p>
          </Kartu>
        </>
      ) : null}
    </>
  );
}
