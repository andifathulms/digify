"use client";


import BarisMenuTersimpan from "@/components/ui/BarisMenuTersimpan";
import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks } from "@/components/ui/Field";
import Kartu, { AngkaSorot } from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import SimpanStruk from "@/components/ui/SimpanStruk";
import { Struk, StrukCatatan, StrukGaris, StrukJudul, StrukTotal } from "@/components/ui/Struk";
import { CONTOH_MENU, NAMA_WARUNG } from "@/lib/contoh";
import { formatPersen, formatRupiah, tanggalHariIni } from "@/lib/format";
import type { LaporanRequest, LaporanResponse, MenuUntukLaporan } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";
import { daftarSah, useUrlState } from "@/lib/useUrlState";
import { useMenuTersimpan } from "@/lib/useMenuTersimpan";

/** Tab 5 · Laporan Final. */
export default function Laporan() {
  const [namaRestoran, setNamaRestoran] = useUrlState("warung", NAMA_WARUNG);
  const [tanggal, setTanggal] = useUrlState("tanggal", tanggalHariIni());
  const [menu, setMenu] = useUrlState<MenuUntukLaporan[]>(
    "daftar",
    CONTOH_MENU.map((baris) => ({
      name: baris.name,
      cogs: baris.cogs,
      oldPrice: baris.price,
      // Contoh perubahan harga: naik seribu, supaya laporan langsung ada isinya.
      newPrice: baris.price + 1000,
      margin: 0,
      weeklySales: baris.weeklySales,
    })),
    daftarSah({ name: "", cogs: 0, oldPrice: 0, newPrice: 0, margin: 0, weeklySales: 0 }),
  );

  const { hasil, sedangJalan, tampilkanTunggu, galat, jalankan } = useAnalisa<LaporanResponse, LaporanRequest>(
    "/export",
  );
  const tersimpan = useMenuTersimpan();

  function ubahBaris(indeks: number, perubahan: Partial<MenuUntukLaporan>) {
    setMenu(menu.map((baris, i) => (i === indeks ? { ...baris, ...perubahan } : baris)));
  }

  return (
    <>
      <Kartu
        judul="Rangkum semua perubahan"
        keterangan="Isi harga lama dan harga baru tiap menu. Hasilnya jadi satu laporan yang bisa Anda simpan atau tunjukkan ke rekan."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldTeks label="Nama warung" nilai={namaRestoran} onUbah={setNamaRestoran} />
          <FieldTeks label="Tanggal laporan" nilai={tanggal} onUbah={setTanggal} />
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {menu.map((baris, indeks) => (
            <div
              key={indeks}
              className="rounded-[var(--radius)] p-4"
              style={{ background: "var(--bg)", border: "1px solid var(--line)" }}
            >
              <FieldTeks
                label="Nama menu"
                nilai={baris.name}
                onUbah={(nilai) => ubahBaris(indeks, { name: nilai })}
              />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FieldAngka
                  label="Biaya bahan"
                  nilai={baris.cogs}
                  onUbah={(nilai) => ubahBaris(indeks, { cogs: nilai })}
                  rupiah
                />
                <FieldAngka
                  label="Terjual seminggu"
                  nilai={baris.weeklySales}
                  onUbah={(nilai) => ubahBaris(indeks, { weeklySales: nilai })}
                  satuan="porsi"
                />
                <FieldAngka
                  label="Harga lama"
                  nilai={baris.oldPrice}
                  onUbah={(nilai) => ubahBaris(indeks, { oldPrice: nilai })}
                  rupiah
                />
                <FieldAngka
                  label="Harga baru"
                  nilai={baris.newPrice}
                  onUbah={(nilai) => ubahBaris(indeks, { newPrice: nilai })}
                  rupiah
                />
              </div>
            </div>
          ))}
        </div>

        <BarisMenuTersimpan
          jumlahTersimpan={tersimpan.menu?.length ?? 0}
          onMuat={() =>
            setMenu(
              (tersimpan.menu ?? []).map((baris) => ({
                name: baris.name,
                cogs: baris.cogs,
                oldPrice: baris.price,
                newPrice: baris.price,
                margin: 0,
                weeklySales: baris.weekly_sales,
              })),
            )
          }
          onSimpan={() =>
            tersimpan.simpan(
              menu.map((baris) => ({
                name: baris.name,
                cogs: baris.cogs,
                // Harga BARU yang disimpan: setelah menyusun laporan, itulah
                // harga yang berlaku di warung mulai sekarang.
                price: baris.newPrice,
                weekly_sales: baris.weeklySales,
                status: "" as const,
              })),
            )
          }
          sedangSimpan={tersimpan.sedangSimpan}
          galat={tersimpan.galat}
          pesanSimpan={tersimpan.pesanSimpan}
        />

        <div className="mt-4">
          <Button
            lebarPenuh
            ukuran="besar"
            memuat={sedangJalan}
            onClick={() =>
              jalankan({ restaurantName: namaRestoran, date: tanggal, menuItems: menu })
            }
          >
            {sedangJalan ? "Sedang menyusun…" : "Susun laporan"}
          </Button>
        </div>
      </Kartu>

      {tampilkanTunggu ? <SedangMenghitung pesan="Sedang menyusun laporan…" /> : null}
      {galat ? <PesanGagal pesan={galat} /> : null}

      {hasil && !sedangJalan ? (
        <>
          <Kartu judul="Ringkasan laporan">
            <div className="grid gap-3 sm:grid-cols-3">
              <AngkaSorot label="Jumlah menu" nilai={String(hasil.ringkasan.total_item)} />
              <AngkaSorot
                label="Harga yang diubah"
                nilai={String(hasil.ringkasan.item_direprice)}
                keterangan="menu"
              />
              <AngkaSorot
                label="Perkiraan tambahan profit"
                nilai={formatRupiah(hasil.ringkasan.estimasi_kenaikan_profit_bulanan)}
                keterangan="per bulan"
                warna={
                  hasil.ringkasan.estimasi_kenaikan_profit_bulanan >= 0
                    ? "var(--green)"
                    : "var(--red)"
                }
              />
            </div>
            {hasil.ringkasan.catatan_penutup ? (
              <p className="mt-4 text-sm leading-relaxed">{hasil.ringkasan.catatan_penutup}</p>
            ) : null}
          </Kartu>

          <SimpanStruk judul={hasil.nama_restoran}>
            <Struk>
              <StrukJudul judul={hasil.nama_restoran} subjudul={hasil.tanggal} />
              <StrukGaris />

              {/* Tiap menu jadi satu blok, bukan satu baris tabel 7 kolom.
                  Tabel 7 kolom mustahil dibaca di layar 360px. */}
              {hasil.menu_items.map((baris, indeks) => (
                <div key={`${baris.nama_menu}-${indeks}`} className="py-2.5">
                  <p className="text-sm font-semibold">{baris.nama_menu}</p>
                  <dl
                    className="tabular mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs"
                    style={{ color: "var(--ink-dim)" }}
                  >
                    <div className="flex justify-between">
                      <dt>Biaya bahan</dt>
                      <dd>{formatRupiah(baris.biaya_bahan)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Margin</dt>
                      <dd>{formatPersen(baris.margin)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Harga lama</dt>
                      <dd>{formatRupiah(baris.harga_lama)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Harga baru</dt>
                      <dd style={{ color: "var(--ink)", fontWeight: 600 }}>
                        {formatRupiah(baris.harga_baru)}
                      </dd>
                    </div>
                    <div className="col-span-2 flex justify-between">
                      <dt>Terjual seminggu</dt>
                      <dd>{baris.terjual_per_minggu} porsi</dd>
                    </div>
                  </dl>
                  {baris.catatan ? (
                    <p className="mt-1.5 text-xs leading-relaxed">{baris.catatan}</p>
                  ) : null}
                </div>
              ))}

              <StrukTotal
                label="Perkiraan tambahan profit"
                nilai={`${formatRupiah(hasil.ringkasan.estimasi_kenaikan_profit_bulanan)}/bln`}
              />
              <StrukCatatan>
                Simpan laporan ini dan bandingkan dengan hasil nyata bulan depan.
              </StrukCatatan>
            </Struk>
          </SimpanStruk>
        </>
      ) : null}
    </>
  );
}
