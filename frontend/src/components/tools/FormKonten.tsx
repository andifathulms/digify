"use client";

import { FieldPilihan, FieldTeks, FieldTeksPanjang } from "@/components/ui/Field";
import { GAYA_BAHASA, PLATFORM } from "@/lib/contoh";

/**
 * Isian yang dipakai bersama Tab 8, 9, dan 10.
 *
 * Tab 9 dan 10 memanggil endpoint yang sama dan hanya berbeda cara
 * menampilkan hasilnya, jadi formnya juga tidak perlu ditulis tiga kali.
 */

export type IsiFormKonten = {
  namaMenu: string;
  keunggulan: string;
  platform: string;
  gaya: string;
  infoPromo: string;
};

export default function FormKonten({
  isi,
  onUbah,
}: {
  isi: IsiFormKonten;
  onUbah: (isi: IsiFormKonten) => void;
}) {
  function ubah(perubahan: Partial<IsiFormKonten>) {
    onUbah({ ...isi, ...perubahan });
  }

  return (
    <div className="flex flex-col gap-4">
      <FieldTeks
        label="Menu yang mau dipromosikan"
        nilai={isi.namaMenu}
        onUbah={(nilai) => ubah({ namaMenu: nilai })}
      />

      <FieldTeksPanjang
        label="Apa yang membuatnya enak atau beda?"
        bantuan="Sebut yang benar-benar ada. Yang ditulis di sini yang akan dipakai — tidak akan mengarang klaim."
        nilai={isi.keunggulan}
        onUbah={(nilai) => ubah({ keunggulan: nilai })}
        baris={3}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldPilihan
          label="Mau diposting di mana?"
          nilai={isi.platform}
          pilihan={PLATFORM}
          onUbah={(nilai) => ubah({ platform: nilai })}
        />
        <FieldPilihan
          label="Gaya bahasanya"
          nilai={isi.gaya}
          pilihan={GAYA_BAHASA}
          onUbah={(nilai) => ubah({ gaya: nilai })}
        />
      </div>

      <FieldTeks
        label="Ada promo yang sedang jalan? (boleh dikosongkan)"
        nilai={isi.infoPromo}
        onUbah={(nilai) => ubah({ infoPromo: nilai })}
        placeholder="Misalnya: beli 2 gratis 1 sampai akhir bulan"
      />
    </div>
  );
}
