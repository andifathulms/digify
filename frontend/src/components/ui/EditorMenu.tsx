"use client";

import Button from "@/components/ui/Button";
import { FieldAngka, FieldTeks } from "@/components/ui/Field";
import TempelDaftarMenu from "@/components/ui/TempelDaftarMenu";

/**
 * Editor daftar menu, dipakai bersama Tab 3, 4, 5, dan 7.
 *
 * Bentuknya kartu bertumpuk, BUKAN tabel — di 360px tabel dengan 4 kolom
 * angka pasti berakhir jadi scroll horizontal (PRD §4). Tiap menu jadi satu
 * kartu dengan isiannya sendiri, dan di layar lebar isian itu berbaris.
 *
 * Di atasnya ada jalan pintas menempel seluruh daftar sekaligus. Ditaruh di
 * sini, bukan di tiap tab, supaya setiap alat yang meminta daftar menu
 * mendapatkannya tanpa disalin ulang.
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
      {/* Hasil tempelan menimpa seluruh daftar, bukan menambah di belakangnya.
       * Yang ditimpa hampir selalu contoh bawaan, dan menambahkan di
       * belakangnya justru meninggalkan menu contoh yang bukan miliknya
       * tercampur di dalam hitungan profitnya sendiri.
       *
       * Kolom di luar keempat kolom dasar (mis. `status` di Tab 4) diambil
       * dari barisBaru(), jadi baris hasil tempelan tetap berbentuk lengkap
       * seperti baris yang dibuat lewat "+ Tambah menu". */}
      <TempelDaftarMenu
        onTerima={(terurai) =>
          onUbah(terurai.map((baris) => ({ ...barisBaru(), ...baris })))
        }
      />

      {menu.map((baris, indeks) => (
        <div
          key={indeks}
          className="rounded-[var(--radius)] p-4"
          style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="tabular flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                style={{ background: "var(--blue-wash)", color: "var(--blue-600)" }}
              >
                {indeks + 1}
              </span>
              <span className="label-kecil" style={{ color: "var(--ink-dim)" }}>
                Menu
              </span>
            </span>
            {menu.length > 1 ? (
              // Tinggi 36px, bukan 44px: ini aksi merusak yang tidak boleh
              // segampang menekan tombol utama, tapi tetap harus bisa kena
              // jempol. Warnanya merah tanpa latar supaya tidak bersaing
              // dengan tombol "Tambah menu" di bawah.
              <button
                type="button"
                onClick={() => hapusBaris(indeks)}
                className="cursor-pointer rounded-[var(--radius-xs)] px-2.5 text-xs font-semibold"
                style={{ color: "var(--red)", minHeight: "var(--tap)" }}
              >
                {/* Nomor barisnya ikut di nama tombol.
                  * Lima baris menu menghasilkan lima tombol bernama "Hapus"
                  * yang persis sama. Pembaca layar yang menampilkan daftar
                  * tombol — cara paling lazim menelusuri halaman — mendapat
                  * lima entri kembar tanpa cara membedakannya. Nomornya
                  * ditulis terlihat, bukan lewat aria-label: kalau ambigu bagi
                  * satu orang, ia ambigu juga bagi yang lain. */}
                Hapus menu {indeks + 1}
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col gap-3">
            <FieldTeks
              label="Nama menu"
              nilai={baris.name}
              onUbah={(nilai) => ubahBaris(indeks, { name: nilai } as Partial<T>)}
            />
            {/* Dua kolom sejak layar terkecil. Isian rupiah cukup pendek untuk
             * muat berdampingan di 360px, dan menumpuknya ke bawah membuat
             * daftar lima menu jadi hampir dua layar penuh gulir — sementara
             * biaya dan harga justru paling berguna kalau terlihat bersebelahan.
             * "Terjual seminggu" tetap selebar penuh karena chip satuannya
             * memakan ruang. */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
              <div className="col-span-2 sm:col-span-1">
                <FieldAngka
                  label="Terjual seminggu"
                  nilai={baris.weeklySales}
                  onUbah={(nilai) => ubahBaris(indeks, { weeklySales: nilai } as Partial<T>)}
                  satuan="porsi"
                />
              </div>
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
