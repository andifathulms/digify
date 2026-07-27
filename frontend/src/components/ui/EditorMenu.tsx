"use client";

import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks } from "@/components/ui/Field";

/**
 * Editor daftar menu, dipakai bersama Tab 3, 4, 5, dan 7.
 *
 * Bentuknya kartu bertumpuk, BUKAN tabel — di 360px tabel dengan 4 kolom
 * angka pasti berakhir jadi scroll horizontal (PRD §4). Tiap menu jadi satu
 * kartu dengan isiannya sendiri, dan di layar lebar isian itu berbaris.
 */

export type BarisMenu = {
  name: string;
  cogs: number;
  price: number;
  weeklySales: number;
};

export default function EditorMenu<T extends BarisMenu>({
  menu,
  onUbah,
  barisBaru,
}: {
  menu: T[];
  onUbah: (menu: T[]) => void;
  barisBaru: () => T;
}) {
  function ubahBaris(indeks: number, perubahan: Partial<T>) {
    onUbah(menu.map((baris, i) => (i === indeks ? { ...baris, ...perubahan } : baris)));
  }

  function hapusBaris(indeks: number) {
    onUbah(menu.filter((_, i) => i !== indeks));
  }

  return (
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
                onClick={() => hapusBaris(indeks)}
                className="px-2 py-1 text-xs font-semibold"
                style={{ color: "var(--red)" }}
              >
                Hapus baris
              </button>
            ) : null}
          </div>

          <div className="mt-2 flex flex-col gap-3">
            <FieldTeks
              label="Nama menu"
              nilai={baris.name}
              onUbah={(nilai) => ubahBaris(indeks, { name: nilai } as Partial<T>)}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <FieldAngka
                label="Biaya bahan"
                nilai={baris.cogs}
                onUbah={(nilai) => ubahBaris(indeks, { cogs: nilai } as Partial<T>)}
                rupiah
              />
              <FieldAngka
                label="Harga jual"
                nilai={baris.price}
                onUbah={(nilai) => ubahBaris(indeks, { price: nilai } as Partial<T>)}
                rupiah
              />
              <FieldAngka
                label="Terjual seminggu"
                nilai={baris.weeklySales}
                onUbah={(nilai) => ubahBaris(indeks, { weeklySales: nilai } as Partial<T>)}
                satuan="porsi"
              />
            </div>
          </div>
        </div>
      ))}

      <Button peran="kedua" onClick={() => onUbah([...menu, barisBaru()])}>
        + Tambah menu
      </Button>
    </div>
  );
}
