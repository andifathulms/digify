"use client";

import { useState } from "react";

import BarisMenuTersimpan from "@/components/ui/BarisMenuTersimpan";
import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks, FieldTeksPanjang } from "@/components/ui/Field";
import Kartu from "@/components/ui/Kartu";
import { KeadaanKosong, PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import { CONTOH_KONDISI, CONTOH_MENU, CONTOH_TARGET_PELANGGAN } from "@/lib/contoh";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { IdeMenuRequest, IdeMenuResponse, MenuExisting } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";
import { useMenuTersimpan } from "@/lib/useMenuTersimpan";

/** Tab 7 · Ide Menu Baru. */
export default function IdeMenu() {
  const [menu, setMenu] = useState<MenuExisting[]>(
    CONTOH_MENU.map((baris) => ({ name: baris.name, price: baris.price, margin: 0 })),
  );
  const [kondisi, setKondisi] = useState(CONTOH_KONDISI);
  const [targetPelanggan, setTargetPelanggan] = useState(CONTOH_TARGET_PELANGGAN);
  const [batasBiaya, setBatasBiaya] = useState(10000);
  const [jumlahIde, setJumlahIde] = useState(3);

  const { hasil, sedangJalan, galat, jalankan } = useAnalisa<IdeMenuResponse, IdeMenuRequest>(
    "/menu-ideas",
  );
  const tersimpan = useMenuTersimpan();

  function ubahBaris(indeks: number, perubahan: Partial<MenuExisting>) {
    setMenu(menu.map((baris, i) => (i === indeks ? { ...baris, ...perubahan } : baris)));
  }

  return (
    <>
      <Kartu
        judul="Menu baru apa yang cocok?"
        keterangan="Ide dibatasi biaya bahan yang Anda tentukan, supaya modalnya benar-benar terjangkau warung Anda."
      >
        <p className="mb-3 text-sm font-medium">Menu yang sudah ada sekarang</p>
        <div className="flex flex-col gap-3">
          {menu.map((baris, indeks) => (
            <div
              key={indeks}
              className="rounded-[var(--radius)] p-4"
              style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold" style={{ color: "var(--ink-dim)" }}>
                  Menu {indeks + 1}
                </span>
                {menu.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setMenu(menu.filter((_, i) => i !== indeks))}
                    className="px-2 py-1 text-xs font-semibold"
                    style={{ color: "var(--red)" }}
                  >
                    Hapus baris
                  </button>
                ) : null}
              </div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <FieldTeks
                  label="Nama menu"
                  nilai={baris.name}
                  onUbah={(nilai) => ubahBaris(indeks, { name: nilai })}
                />
                <FieldAngka
                  label="Harga jual"
                  nilai={baris.price}
                  onUbah={(nilai) => ubahBaris(indeks, { price: nilai })}
                  rupiah
                />
              </div>
            </div>
          ))}
          <Button
            peran="kedua"
            onClick={() => setMenu([...menu, { name: "", price: 0, margin: 0 }])}
          >
            + Tambah menu
          </Button>
        </div>

        <BarisMenuTersimpan
          jumlahTersimpan={tersimpan.menu?.length ?? 0}
          onMuat={() =>
            setMenu(
              (tersimpan.menu ?? []).map((baris) => ({
                name: baris.name,
                price: baris.price,
                margin: 0,
              })),
            )
          }
          onSimpan={() =>
            tersimpan.simpan(
              menu.map((baris) => ({
                name: baris.name,
                // Tab ini tidak menanyakan biaya bahan dan jumlah terjual,
                // jadi keduanya diisi 0 dan bisa dilengkapi di tab lain.
                cogs: 0,
                price: baris.price,
                weekly_sales: 0,
                status: "" as const,
              })),
            )
          }
          sedangSimpan={tersimpan.sedangSimpan}
          galat={tersimpan.galat}
          pesanSimpan={tersimpan.pesanSimpan}
        />

        <div className="mt-5 flex flex-col gap-4">
          <FieldTeksPanjang
            label="Apa yang sedang Anda rasakan kurang?"
            bantuan="Ceritakan apa adanya. Ini yang dipakai untuk mencari celahnya."
            nilai={kondisi}
            onUbah={setKondisi}
            baris={3}
          />
          <FieldTeks
            label="Siapa pembeli Anda?"
            nilai={targetPelanggan}
            onUbah={setTargetPelanggan}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldAngka
              label="Batas biaya bahan per porsi"
              bantuan="Ide yang lebih mahal dari ini tidak akan ditampilkan."
              nilai={batasBiaya}
              onUbah={setBatasBiaya}
              rupiah
            />
            <FieldAngka
              label="Berapa ide yang Anda mau?"
              nilai={jumlahIde}
              onUbah={setJumlahIde}
              satuan="ide"
            />
          </div>

          <Button
            lebarPenuh
            ukuran="besar"
            memuat={sedangJalan}
            onClick={() =>
              jalankan({
                existingMenu: menu,
                kondisi,
                targetPelanggan,
                maxCogs: batasBiaya,
                jumlahIde,
              })
            }
          >
            {sedangJalan ? "Sedang memikirkan…" : "Carikan ide menu"}
          </Button>
        </div>
      </Kartu>

      {sedangJalan ? (
        <SedangMenghitung pesan="Sedang memikirkan ide… bisa 10–30 detik." />
      ) : null}
      {galat ? <PesanGagal pesan={galat} /> : null}

      {hasil && !sedangJalan ? (
        <>
          {hasil.ringkasan_analisa ? (
            <Kartu judul="Celah yang kami lihat">
              <p className="text-sm leading-relaxed">{hasil.ringkasan_analisa}</p>
            </Kartu>
          ) : null}

          {hasil.ide_menu.length === 0 ? (
            <KeadaanKosong>
              Belum ada ide yang muat di batas biaya {formatRupiah(batasBiaya)}. Coba naikkan
              batasnya sedikit, lalu minta lagi.
            </KeadaanKosong>
          ) : (
            hasil.ide_menu.map((ide, indeks) => (
              <Kartu key={`${ide.nama}-${indeks}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="judul-kecil text-lg">{ide.nama}</h3>
                  <div className="flex gap-2">
                    {ide.kategori ? (
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: "var(--blue-wash)", color: "var(--blue-deep)" }}
                      >
                        {ide.kategori}
                      </span>
                    ) : null}
                    {ide.kesulitan ? (
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: "var(--orange-wash)", color: "var(--orange-600)" }}
                      >
                        {ide.kesulitan}
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="mt-2 text-sm leading-relaxed">{ide.deskripsi}</p>

                <dl
                  className="tabular mt-4 grid grid-cols-3 gap-2 rounded-[var(--radius)] px-4 py-3 text-center"
                  style={{ background: "var(--bg)" }}
                >
                  <div>
                    <dt className="text-xs" style={{ color: "var(--ink-dim)" }}>
                      Biaya bahan
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold">{formatRupiah(ide.cogs)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs" style={{ color: "var(--ink-dim)" }}>
                      Harga jual
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold">{formatRupiah(ide.harga)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs" style={{ color: "var(--ink-dim)" }}>
                      Untung
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold" style={{ color: "var(--green)" }}>
                      {formatRupiah(ide.harga - ide.cogs)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-1.5 text-center text-xs" style={{ color: "var(--ink-dim)" }}>
                  Margin {formatPersen(ide.margin)}
                </p>

                {ide.bahan.length > 0 ? (
                  <p className="mt-3 text-sm leading-relaxed">
                    <span className="font-medium">Bahan: </span>
                    <span style={{ color: "var(--ink-dim)" }}>{ide.bahan.join(", ")}</span>
                  </p>
                ) : null}

                {ide.alasan ? (
                  <p
                    className="mt-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm leading-relaxed"
                    style={{ background: "var(--bg)" }}
                  >
                    {ide.alasan}
                  </p>
                ) : null}
              </Kartu>
            ))
          )}

          {hasil.tips_eksekusi.length > 0 ? (
            <Kartu judul="Sebelum mulai jualan">
              <ul className="flex flex-col gap-2.5">
                {hasil.tips_eksekusi.map((tips, indeks) => (
                  <li key={indeks} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      aria-hidden
                      className="tabular mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ background: "var(--blue-wash)", color: "var(--blue-deep)" }}
                    >
                      {indeks + 1}
                    </span>
                    {tips}
                  </li>
                ))}
              </ul>
            </Kartu>
          ) : null}
        </>
      ) : null}
    </>
  );
}
