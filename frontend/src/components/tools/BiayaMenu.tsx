"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks, FieldTeksPanjang } from "@/components/ui/Field";
import Kartu, { AngkaSorot } from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import {
  Struk,
  StrukBarisBahan,
  StrukCatatan,
  StrukGaris,
  StrukJudul,
  StrukTotal,
} from "@/components/ui/Struk";
import { CONTOH_BAHAN, MENU_UTAMA, NAMA_WARUNG } from "@/lib/contoh";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { BiayaMenuRequest, BiayaMenuResponse } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";

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
