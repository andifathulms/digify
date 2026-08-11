"use client";

import { useState } from "react";

import Button from "@/components/ui/Button";
import { FieldTeksPanjang } from "@/components/ui/Field";
import { uraiDaftarMenu, type BarisMenuTerurai } from "@/lib/uraiDaftarMenu";

/**
 * Tempel daftar menu sekaligus, alih-alih mengetik empat isian per menu.
 *
 * ── Kenapa ada ────────────────────────────────────────────────────────────
 * Umpan balik calon pengguna: "kira-kira ada nggak yang sistemnya nggak
 * terlalu manual nulisnya?" Sepuluh menu berarti empat puluh isian dengan
 * jempol. Daftar tersimpan menolong dari menu kedua dan seterusnya, tapi
 * pengisian pertama tetap manual seluruhnya — dan itu pintu masuk produk ini.
 *
 * ── Kenapa tertutup secara bawaan ─────────────────────────────────────────
 * Kebalikan dari contoh carousel di Tab 10, yang harus terbuka karena ia
 * barang jadinya. Yang ini jalan pintas: berguna sekali di awal, lalu tidak
 * pernah dipakai lagi setelah daftarnya tersimpan. Terbuka terus-menerus ia
 * cuma mendorong isian yang sebenarnya ke bawah layar.
 *
 * ── Kenapa hasilnya langsung masuk ke baris, bukan ke pratinjau ────────────
 * Barisnya sendiri sudah menjadi pratinjau: ia terlihat, bisa diubah, dan
 * belum terkirim ke mana pun. Menambahkan layar konfirmasi di antaranya cuma
 * menambah satu ketukan untuk hal yang sudah kelihatan.
 */

export default function TempelDaftarMenu({
  onTerima,
}: {
  onTerima: (menu: BarisMenuTerurai[]) => void;
}) {
  const [teks, setTeks] = useState("");
  const [gagal, setGagal] = useState<string[]>([]);
  const [jumlahTerbaca, setJumlahTerbaca] = useState<number | null>(null);

  function baca() {
    const hasil = uraiDaftarMenu(teks);
    setGagal(hasil.gagal);
    setJumlahTerbaca(hasil.menu.length);
    if (hasil.menu.length > 0) onTerima(hasil.menu);
  }

  return (
    <details className="group mb-4">
      <summary
        className="flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius)] px-4 py-3 text-sm font-semibold"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          minHeight: "var(--tap)",
        }}
      >
        Sudah punya daftarnya? Tempel sekaligus
        <span aria-hidden style={{ color: "var(--ink-soft)" }} className="group-open:hidden">
          Buka
        </span>
        <span aria-hidden style={{ color: "var(--ink-soft)" }} className="hidden group-open:inline">
          Tutup
        </span>
      </summary>

      <div
        className="mt-2 rounded-[var(--radius)] p-4"
        style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
      >
        <FieldTeksPanjang
          label="Daftar menu Anda"
          bantuan="Satu menu per baris: nama, biaya bahan, harga jual, terjual seminggu. Boleh dipisah garis tegak, koma, atau spasi — contoh: Nasi Goreng | 8500 | 25000 | 70"
          nilai={teks}
          onUbah={setTeks}
          baris={6}
          placeholder={"Nasi Goreng Spesial | 8500 | 25000 | 70\nEs Teh Manis | 1500 | 5000 | 200"}
        />

        <div className="mt-3">
          <Button peran="kedua" onClick={baca}>
            Baca daftar ini
          </Button>
        </div>

        {jumlahTerbaca !== null ? (
          <p className="mt-3 text-sm leading-relaxed">
            {jumlahTerbaca > 0
              ? `${jumlahTerbaca} menu terbaca dan sudah mengisi daftar di bawah. Periksa angkanya sebentar, lalu perbaiki yang meleset.`
              : "Belum ada baris yang bisa dibaca. Pastikan tiap baris punya nama menu dan angkanya."}
          </p>
        ) : null}

        {/* Baris yang gagal ditunjukkan apa adanya, tidak dibuang diam-diam.
            Daftar yang kurang satu menu membuat total profit mingguan terbaca
            lebih kecil, dan tidak ada yang menandainya. */}
        {gagal.length > 0 ? (
          <div
            className="mt-3 px-3.5 py-3"
            style={{
              background: "var(--yellow-wash)",
              borderLeft: "3px solid var(--yellow)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <p className="text-sm font-semibold">
              {gagal.length} baris belum masuk karena angkanya belum terbaca
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {gagal.map((baris, indeks) => (
                <li
                  key={`${baris}-${indeks}`}
                  className="tabular px-2.5 py-1.5 text-sm"
                  style={{ background: "var(--surface)", borderRadius: "var(--radius-xs)" }}
                >
                  {baris}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm" style={{ color: "var(--ink-dim)" }}>
              Tambahkan angkanya di baris itu, lalu tekan “Baca daftar ini” lagi — atau isi
              langsung di daftar di bawah.
            </p>
          </div>
        ) : null}
      </div>
    </details>
  );
}
