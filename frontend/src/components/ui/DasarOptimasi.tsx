import { AMBANG_LARIS } from "@/lib/aturan";
import { formatRupiah } from "@/lib/format";

/**
 * Menerangkan metode di balik keempat kelompok Tab 4, berikut posisi tiap
 * menu pada dua sumbunya.
 *
 * ── Yang hilang sebelumnya ─────────────────────────────────────────────────
 * Keempat kelompok — dorong, perbaiki harga, paketkan, hentikan — berasal
 * dari matriks menu engineering Kasavana–Smith, metode baku industri restoran
 * yang sudah dipakai puluhan tahun. Kata "Kasavana" tidak muncul satu kali
 * pun di seluruh frontend. Jadi pemilik warung membaca menunya disortir ke
 * empat nasib seolah-olah itu pendapat kami.
 *
 * Menyebut metodenya mengerjakan dua hal yang tidak bisa dikerjakan hal lain:
 * memberi tahu bahwa ini praktik mapan, bukan karangan aplikasi, dan memberi
 * pemakainya nama yang bisa ia cari sendiri di luar sini.
 *
 * ── Angka sumbunya dihitung ulang di klien ────────────────────────────────
 * Rata-rata terjual dan rata-rata untung per porsi tidak ada di response.
 * Keduanya dihitung dari daftar menu yang SAMA PERSIS dengan yang dikirim ke
 * backend, dengan rumus yang sama (rata-rata polos, ambang laris 70% dari
 * rata-rata), jadi hasilnya identik — bukan perkiraan.
 */

export type BarisSumbu = {
  name: string;
  cogs: number;
  price: number;
  weeklySales: number;
};

export default function DasarOptimasi({ menu }: { menu: BarisSumbu[] }) {
  const dipakai = menu.filter((baris) => baris.name.trim() !== "");
  if (dipakai.length === 0) return null;

  const rataTerjual =
    dipakai.reduce((jumlah, b) => jumlah + b.weeklySales, 0) / dipakai.length;
  const rataUntung =
    dipakai.reduce((jumlah, b) => jumlah + (b.price - b.cogs), 0) / dipakai.length;
  const batasLaris = rataTerjual * AMBANG_LARIS;

  return (
    <div
      className="px-4 py-4 sm:px-5"
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <p className="text-sm font-semibold">Dasar pengelompokannya</p>
      <p className="teks-rapi mt-1.5 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        Memakai matriks menu engineering <strong>Kasavana–Smith</strong> — metode baku yang
        sudah dipakai puluhan tahun di industri restoran, bukan aturan karangan aplikasi ini.
        Tiap menu diukur pada dua sumbu: seberapa laris dibanding menu Anda yang lain, dan
        seberapa tebal untung per porsinya dibanding menu Anda yang lain.
      </p>

      <dl className="tabular mt-3 flex flex-col gap-1 text-sm">
        <div className="flex justify-between gap-3">
          <dt style={{ color: "var(--ink-dim)" }}>Rata-rata terjual seminggu</dt>
          <dd className="font-semibold">{Math.round(rataTerjual)} porsi</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt style={{ color: "var(--ink-dim)" }}>Batas &ldquo;laris&rdquo;</dt>
          <dd className="font-semibold">{Math.round(batasLaris)} porsi</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt style={{ color: "var(--ink-dim)" }}>Rata-rata untung per porsi</dt>
          <dd className="font-semibold">{formatRupiah(Math.round(rataUntung))}</dd>
        </div>
      </dl>

      <p className="teks-rapi mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        Batas laris memakai {Math.round(AMBANG_LARIS * 100)}% dari rata-rata, bukan
        rata-rata penuh. Itu bagian dari metode aslinya: dengan sepuluh menu, hampir
        separuhnya pasti berada di bawah rata-rata semata karena aritmetika, dan menghukum
        menu yang sebenarnya baik-baik saja.
      </p>

      <p className="teks-rapi mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        Perbandingannya selalu terhadap menu Anda sendiri, bukan terhadap warung lain — jadi
        satu menu bisa berpindah kelompok hanya karena menu di sebelahnya berubah.
      </p>
    </div>
  );
}

/** Posisi satu menu pada kedua sumbu, ditulis di kartu menu itu sendiri. */
export function PosisiSumbu({
  baris,
  rataTerjual,
  rataUntung,
}: {
  baris: BarisSumbu;
  rataTerjual: number;
  rataUntung: number;
}) {
  const untung = baris.price - baris.cogs;
  const laris = baris.weeklySales >= rataTerjual * AMBANG_LARIS;
  const tebal = untung >= rataUntung;

  return (
    <p className="tabular mt-1.5 text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
      Laku {baris.weeklySales}/minggu — {laris ? "di atas" : "di bawah"} batas{" "}
      {Math.round(rataTerjual * AMBANG_LARIS)}. Untung {formatRupiah(untung)}/porsi —{" "}
      {tebal ? "di atas" : "di bawah"} rata-rata {formatRupiah(Math.round(rataUntung))}.
    </p>
  );
}
