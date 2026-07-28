"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks } from "@/components/ui/Field";
import Kartu, { AngkaSorot } from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import {
  Struk,
  StrukBaris,
  StrukCatatan,
  StrukGaris,
  StrukJudul,
  StrukTotal,
} from "@/components/ui/Struk";
import { MENU_UTAMA } from "@/lib/contoh";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { HargaJualRequest, HargaJualResponse } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";

/** Tab 2 · Harga Jual. */
export default function HargaJual() {
  const [namaMenu, setNamaMenu] = useState(MENU_UTAMA);
  const [biayaBahan, setBiayaBahan] = useState(8500);
  const [targetMargin, setTargetMargin] = useState(65);
  const [hargaKompetitor, setHargaKompetitor] = useState(24000);
  const [komisi, setKomisi] = useState(27);
  const [lokasi, setLokasi] = useState("Semarang");

  const { hasil, sedangJalan, galat, jalankan } = useAnalisa<
    HargaJualResponse,
    HargaJualRequest
  >("/pricing");

  return (
    <>
      <Kartu
        judul="Harga berapa yang benar?"
        keterangan="Harga untuk ojol dihitung terpisah. Komisi aplikasi bisa 27% — kalau harga di tempat dipakai apa adanya di ojol, untung Anda habis diam-diam."
      >
        <div className="flex flex-col gap-4">
          <FieldTeks label="Nama menu" nilai={namaMenu} onUbah={setNamaMenu} />

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldAngka
              label="Biaya bahan per porsi"
              bantuan="Ambil dari alat Biaya Menu."
              nilai={biayaBahan}
              onUbah={setBiayaBahan}
              rupiah
            />
            <FieldAngka
              label="Target margin"
              nilai={targetMargin}
              onUbah={setTargetMargin}
              satuan="%"
            />
            <FieldAngka
              label="Harga warung sebelah"
              bantuan="Kosongkan (isi 0) kalau tidak tahu."
              nilai={hargaKompetitor}
              onUbah={setHargaKompetitor}
              rupiah
            />
            <FieldAngka
              label="Komisi aplikasi ojol"
              bantuan="GoFood, GrabFood, ShopeeFood. Umumnya 27%."
              nilai={komisi}
              onUbah={setKomisi}
              satuan="%"
            />
          </div>

          <FieldTeks label="Kota atau daerah" nilai={lokasi} onUbah={setLokasi} />

          <Button
            lebarPenuh
            ukuran="besar"
            memuat={sedangJalan}
            onClick={() =>
              jalankan({
                itemName: namaMenu,
                cogs: biayaBahan,
                targetMargin,
                competitorPrice: hargaKompetitor > 0 ? hargaKompetitor : null,
                platformFeePercent: komisi,
                location: lokasi,
              })
            }
          >
            {sedangJalan ? "Sedang menghitung…" : "Hitung harga jual"}
          </Button>
        </div>
      </Kartu>

      {sedangJalan ? <SedangMenghitung /> : null}
      {galat ? <PesanGagal pesan={galat} /> : null}

      {hasil && !sedangJalan ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <AngkaSorot
              label="Harga jual di tempat"
              nilai={formatRupiah(hasil.dine_in_recommended)}
              keterangan={`Margin ${formatPersen(hasil.margin_at_recommended)}`}
              warna="var(--blue-deep)"
            />
            <AngkaSorot
              label="Harga jual di ojol"
              nilai={formatRupiah(hasil.delivery_recommended)}
              keterangan={`Sudah dihitung dengan komisi ${formatPersen(komisi)}`}
              warna="var(--orange)"
            />
          </div>

          <Struk>
            <StrukJudul judul={hasil.item_name} subjudul="Rincian penetapan harga" />
            <StrukGaris />

            <StrukBaris label="Biaya bahan per porsi" nilai={formatRupiah(biayaBahan)} />
            <StrukBaris
              label="Balik modal di tempat"
              keterangan="Di bawah ini Anda rugi"
              nilai={formatRupiah(hasil.break_even_dine_in)}
            />
            <StrukBaris
              label="Balik modal di ojol"
              keterangan={`Biaya bahan ÷ (100% − ${formatPersen(komisi)})`}
              nilai={formatRupiah(hasil.break_even_delivery)}
            />

            <StrukGaris />

            <StrukBaris
              label="Harga yang disarankan (di tempat)"
              nilai={formatRupiah(hasil.dine_in_recommended)}
            />
            <StrukBaris
              label="Harga yang disarankan (ojol)"
              nilai={formatRupiah(hasil.delivery_recommended)}
            />
            <StrukBaris
              label="Harga yang terasa lebih murah"
              keterangan="Angka bulat yang enak dilihat pembeli"
              nilai={formatRupiah(hasil.psychological_price)}
            />

            <StrukTotal
              label="Untung tiap porsi (di tempat)"
              nilai={formatRupiah(hasil.dine_in_recommended - biayaBahan)}
            />
            <StrukCatatan>
              Selisih harga ojol menutup komisi aplikasi, bukan menaikkan untung Anda.
            </StrukCatatan>
          </Struk>
        </>
      ) : null}
    </>
  );
}
