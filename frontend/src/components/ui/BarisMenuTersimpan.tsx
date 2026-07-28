"use client";

import Button from "@/components/ui/Button";
import { PesanGagal } from "@/components/ui/Keadaan";

/**
 * Baris kendali "pakai daftar tersimpan / simpan daftar ini".
 *
 * Tampil di Tab 3, 4, 5, dan 7 — semua tab yang meminta daftar menu. Tujuannya
 * satu: user tidak perlu mengetik ulang daftar menunya di tiap tab
 * (PRD §7.3, insight prioritas #1).
 */
export default function BarisMenuTersimpan({
  jumlahTersimpan,
  onMuat,
  onSimpan,
  sedangSimpan,
  galat,
  pesanSimpan,
}: {
  jumlahTersimpan: number;
  onMuat: () => void;
  onSimpan: () => void;
  sedangSimpan: boolean;
  galat: string | null;
  pesanSimpan: string | null;
}) {
  return (
    <div
      className="mt-4 rounded-[var(--radius)] p-4"
      style={{ background: "var(--blue-wash)" }}
    >
      <p className="text-sm leading-relaxed" style={{ color: "var(--blue-deep)" }}>
        {jumlahTersimpan > 0
          ? `Anda punya ${jumlahTersimpan} menu tersimpan. Pakai lagi di sini tanpa mengetik ulang.`
          : "Simpan daftar ini sekali, lalu daftarnya otomatis terisi di alat lain yang butuh menu."}
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {jumlahTersimpan > 0 ? (
          <Button peran="kedua" onClick={onMuat}>
            Pakai daftar tersimpan
          </Button>
        ) : null}
        <Button peran="kedua" memuat={sedangSimpan} onClick={onSimpan}>
          {sedangSimpan ? "Menyimpan…" : "Simpan daftar ini"}
        </Button>
      </div>

      {pesanSimpan ? (
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--green)" }}>
          {pesanSimpan}
        </p>
      ) : null}
      {galat ? (
        <div className="mt-3">
          <PesanGagal pesan={galat} />
        </div>
      ) : null}
    </div>
  );
}
