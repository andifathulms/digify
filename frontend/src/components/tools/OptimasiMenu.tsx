"use client";

import { useState } from "react";

import BarisMenuTersimpan from "@/components/ui/BarisMenuTersimpan";
import Button from "@/components/ui/Button";
import EditorMenu from "@/components/ui/EditorMenu";
import { FieldAngka, FieldTeks } from "@/components/ui/Field";
import Kartu, { AngkaSorot } from "@/components/ui/Kartu";
import { KeadaanKosong, PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import { CONTOH_MENU } from "@/lib/contoh";
import { formatRupiah } from "@/lib/format";
import type {
  MenuUntukOptimasi,
  OptimasiMenuRequest,
  OptimasiMenuResponse,
  Rekomendasi,
} from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";
import { useMenuTersimpan } from "@/lib/useMenuTersimpan";

/** Empat kelompok tindakan, masing-masing punya warna dan kalimat pembukanya sendiri. */
const KELOMPOK = [
  {
    kunci: "promote" as const,
    judul: "Dorong lebih keras",
    kosong: "Belum ada menu yang perlu didorong khusus.",
    warna: "var(--green)",
    latar: "var(--green-wash)",
  },
  {
    kunci: "reprice" as const,
    judul: "Perbaiki harganya",
    kosong: "Harga menu Anda sudah wajar semua.",
    warna: "var(--yellow)",
    latar: "var(--yellow-wash)",
  },
  {
    kunci: "bundle" as const,
    judul: "Jual sepaket",
    kosong: "Belum ada gabungan menu yang menarik untuk dipaketkan.",
    warna: "var(--blue)",
    latar: "var(--blue-wash)",
  },
  {
    kunci: "remove" as const,
    judul: "Pertimbangkan dihentikan",
    kosong: "Tidak ada menu yang perlu dihentikan. Kabar bagus.",
    warna: "var(--red)",
    latar: "var(--red-wash)",
  },
];

function DaftarRekomendasi({
  rekomendasi,
  warna,
  kosong,
}: {
  rekomendasi: Rekomendasi[];
  warna: string;
  kosong: string;
}) {
  if (rekomendasi.length === 0) {
    return <KeadaanKosong>{kosong}</KeadaanKosong>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rekomendasi.map((baris, indeks) => (
        <li
          key={`${baris.item}-${indeks}`}
          className="rounded-[var(--radius)] p-4"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderLeft: `4px solid ${warna}`,
          }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            {/* h3: kartu pembungkusnya (Kartu) memakai h2, jadi h4 melompati
             * satu tingkat. */}
            <h3 className="text-base font-semibold">{baris.item}</h3>
            {baris.estimasi_dampak !== 0 ? (
              <span
                className="tabular text-sm font-semibold"
                style={{ color: baris.estimasi_dampak > 0 ? "var(--green)" : "var(--red)" }}
              >
                {baris.estimasi_dampak > 0 ? "+" : ""}
                {formatRupiah(baris.estimasi_dampak)}/bulan
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
            {baris.alasan}
          </p>
          <p
            className="mt-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm leading-relaxed"
            style={{ background: "var(--bg)" }}
          >
            {baris.aksi}
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Tab 4 · Optimasi Menu. */
export default function OptimasiMenu() {
  const [menu, setMenu] = useState<MenuUntukOptimasi[]>(
    CONTOH_MENU.map((baris) => ({ ...baris, margin: 0, status: "" as const })),
  );
  const [minItems, setMinItems] = useState(4);
  const [jamSibuk, setJamSibuk] = useState("11.00–13.00 dan 18.00–20.00");

  const { hasil, sedangJalan, galat, jalankan } = useAnalisa<
    OptimasiMenuResponse,
    OptimasiMenuRequest
  >("/menu-engineering");
  const tersimpan = useMenuTersimpan();

  return (
    <>
      <Kartu
        judul="Menu mana yang diapakan?"
        keterangan="Hasilnya dibagi empat: didorong, diperbaiki harganya, dipaketkan, atau dihentikan."
      >
        <EditorMenu
          menu={menu}
          onUbah={setMenu}
          barisBaru={() => ({
            name: "",
            cogs: 0,
            price: 0,
            weeklySales: 0,
            margin: 0,
            status: "" as const,
          })}
        />

        <BarisMenuTersimpan
          jumlahTersimpan={tersimpan.menu?.length ?? 0}
          onMuat={() =>
            setMenu(
              (tersimpan.menu ?? []).map((baris) => ({
                name: baris.name,
                cogs: baris.cogs,
                price: baris.price,
                weeklySales: baris.weekly_sales,
                margin: 0,
                status: baris.status,
              })),
            )
          }
          onSimpan={() =>
            tersimpan.simpan(
              menu.map((baris) => ({
                name: baris.name,
                cogs: baris.cogs,
                price: baris.price,
                weekly_sales: baris.weeklySales,
                status: baris.status,
              })),
            )
          }
          sedangSimpan={tersimpan.sedangSimpan}
          galat={tersimpan.galat}
          pesanSimpan={tersimpan.pesanSimpan}
        />

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FieldAngka
            label="Menu paling sedikit yang harus tetap ada"
            bantuan="Pengaman supaya tidak disarankan menutup hampir semua menu."
            nilai={minItems}
            onUbah={setMinItems}
            satuan="menu"
          />
          <FieldTeks label="Jam paling ramai" nilai={jamSibuk} onUbah={setJamSibuk} />
        </div>

        <div className="mt-4">
          <Button
            lebarPenuh
            ukuran="besar"
            memuat={sedangJalan}
            onClick={() => jalankan({ menuItems: menu, minItems, peakHours: jamSibuk })}
          >
            {sedangJalan ? "Sedang menghitung…" : "Susun rencana perbaikan"}
          </Button>
        </div>
      </Kartu>

      {sedangJalan ? <SedangMenghitung /> : null}
      {galat ? <PesanGagal pesan={galat} /> : null}

      {hasil && !sedangJalan ? (
        <>
          <Kartu>
            <AngkaSorot
              label="Perkiraan dampak kalau semua dijalankan"
              nilai={`${hasil.total_estimated_impact > 0 ? "+" : ""}${formatRupiah(hasil.total_estimated_impact)}`}
              keterangan="Per bulan. Perkiraan, bukan janji — pantau hasil nyatanya sebulan ke depan."
              warna={hasil.total_estimated_impact >= 0 ? "var(--green)" : "var(--red)"}
            />
          </Kartu>

          {KELOMPOK.map((kelompok) => (
            <Kartu key={kelompok.kunci} judul={kelompok.judul}>
              <DaftarRekomendasi
                rekomendasi={hasil[kelompok.kunci]}
                warna={kelompok.warna}
                kosong={kelompok.kosong}
              />
            </Kartu>
          ))}
        </>
      ) : null}
    </>
  );
}
