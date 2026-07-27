"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import EditorMenu from "@/components/ui/EditorMenu";
import Kartu, { AngkaSorot } from "@/components/ui/Kartu";
import { PesanGagal, SedangMenghitung } from "@/components/ui/Keadaan";
import PapanRanking from "@/components/ui/PapanRanking";
import { CONTOH_MENU } from "@/lib/contoh";
import { formatRupiah } from "@/lib/format";
import type { MenuUntukRanking, RankingRequest, RankingResponse } from "@/lib/types/api";
import { useAnalisa } from "@/lib/useAnalisa";

/** Tab 3 · Ranking Profitabilitas. */
export default function Ranking() {
  const [menu, setMenu] = useState<MenuUntukRanking[]>(
    CONTOH_MENU.map((baris) => ({ ...baris })),
  );

  const { hasil, sedangJalan, galat, jalankan } = useAnalisa<RankingResponse, RankingRequest>(
    "/ranking",
  );

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

        <div className="mt-4">
          <Button
            lebarPenuh
            nonaktif={sedangJalan}
            onClick={() => jalankan({ menuItems: menu })}
          >
            {sedangJalan ? "Sedang menghitung…" : "Urutkan menu saya"}
          </Button>
        </div>
      </Kartu>

      {sedangJalan ? <SedangMenghitung /> : null}
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
