"use client";


import BarisMenuTersimpan from "@/components/ui/BarisMenuTersimpan";
import Button from "@/components/ui/Button";
import EditorMenu from "@/components/ui/EditorMenu";
import Kartu, { AngkaSorot } from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import PapanRanking from "@/components/ui/PapanRanking";
import { CONTOH_MENU } from "@/lib/contoh";
import { formatRupiah } from "@/lib/format";
import type { MenuUntukRanking, RankingRequest, RankingResponse } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";
import { daftarSah, useUrlState } from "@/lib/useUrlState";
import { useMenuTersimpan } from "@/lib/useMenuTersimpan";

/** Tab 3 · Ranking Profitabilitas. */
export default function Ranking() {
  const [menu, setMenu] = useUrlState<MenuUntukRanking[]>(
    "daftar",
    CONTOH_MENU.map((baris) => ({ ...baris })),
    daftarSah({ name: "", cogs: 0, price: 0, weeklySales: 0 }),
  );

  const { hasil, sedangJalan, tampilkanTunggu, galat, jalankan } = useAnalisa<RankingResponse, RankingRequest>(
    "/ranking",
  );
  const tersimpan = useMenuTersimpan();

  return (
    <>
      <Kartu
        judul="Menu mana yang paling menghidupi warung?"
        keterangan="Diurutkan dari profit seminggu, bukan dari margin saja. Menu bermargin tipis tapi laris bisa lebih berharga daripada menu bermargin tebal yang jarang laku."
      >
        <EditorMenu
          menu={menu}
          onUbah={setMenu}
          barisBaru={() => ({ name: "", cogs: 0, price: 0, weeklySales: 0 })}
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
            onClick={() => jalankan({ menuItems: menu })}
          >
            {sedangJalan ? "Sedang menghitung…" : "Urutkan menu saya"}
          </Button>
        </div>
      </Kartu>

      {tampilkanTunggu ? <SedangMenghitung /> : null}
      {galat ? <PesanGagal pesan={galat} /> : null}

      {hasil && !sedangJalan ? (
        <>
          <Kartu judul="Ringkasan seminggu">
            <div className="grid gap-3 sm:grid-cols-2">
              <AngkaSorot
                label="Total profit seminggu"
                nilai={formatRupiah(hasil.total_weekly_profit)}
                keterangan={`Sekitar ${formatRupiah(hasil.total_weekly_profit * 4)} sebulan`}
                warna="var(--green)"
              />
              <AngkaSorot
                label="Menu yang perlu ditindak"
                nilai={`${hasil.items_to_reprice + hasil.items_to_remove} dari ${hasil.rankings.length}`}
                keterangan={`${hasil.items_to_promote} pertahankan · ${hasil.items_to_reprice} perbaiki harga · ${hasil.items_to_remove} tinjau ulang`}
              />
            </div>
          </Kartu>

          <PapanRanking rankings={hasil.rankings} />
        </>
      ) : null}
    </>
  );
}
