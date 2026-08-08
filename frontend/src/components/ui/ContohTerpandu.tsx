import { formatRupiah } from "@/lib/format";

/**
 * Contoh yang sudah selesai dikerjakan, ditaruh DI ATAS form Tab 1.
 *
 * ── Kenapa ada ────────────────────────────────────────────────────────────
 * Sebelum ini tidak ada satu pun tempat di dalam aplikasi yang menunjukkan
 * hitungan ini dari awal sampai akhir. Tiap alat terbuka sebagai form yang
 * sudah terisi contoh lalu MENUNGGU — dan form terisi memang bagus, tapi ia
 * cuma membuktikan bahwa tombolnya mengeluarkan sesuatu, bukan menerangkan
 * dari mana sesuatu itu datang. Satu-satunya contoh yang lengkap ada di
 * halaman pemasaran, yang justru tidak pernah dilihat lagi setelah membeli.
 *
 * Jadi tindakan pertama pemakai baru adalah menekan tombol dan menerima
 * sembilan angka, tak satu pun ia lihat proses pembuatannya.
 *
 * Ditaruh di Tab 1 karena halaman "Semua alat" sendiri sudah bilang: semua
 * alat lain berdiri di atas angka ini.
 *
 * ── Kenapa bukan tooltip, modal, atau halaman terpisah ────────────────────
 * Semuanya harus dicari lebih dulu, dan yang perlu diterangkan justru hal
 * yang pemakainya belum tahu perlu ditanyakan. Ini duduk di jalan yang
 * memang dilewatinya, tertutup secara bawaan supaya yang sudah paham tidak
 * perlu melewatinya dua kali.
 *
 * Angkanya SENGAJA berbeda dari contoh yang terisi di form (nasi goreng),
 * supaya jelas ini bacaan, bukan hasil hitungan yang sudah jalan.
 */

const CONTOH = {
  menu: "Es Teh Manis",
  bahan: [
    { nama: "Teh tubruk", jumlah: "8 gram", faktor: "1.000", harga: "Rp 45.000/kg", biaya: 360 },
    { nama: "Gula pasir", jumlah: "20 gram", faktor: "1.000", harga: "Rp 16.000/kg", biaya: 320 },
    { nama: "Es batu", jumlah: "150 gram", faktor: "1.000", harga: "Rp 4.000/kg", biaya: 600 },
    { nama: "Gelas plastik", jumlah: "1 buah", faktor: null, harga: "Rp 550/buah", biaya: 550 },
  ],
  harga: 5000,
};

const BIAYA = CONTOH.bahan.reduce((jumlah, b) => jumlah + b.biaya, 0);
const UNTUNG = CONTOH.harga - BIAYA;
const MARGIN = Math.round((UNTUNG / CONTOH.harga) * 100);

export default function ContohTerpandu() {
  return (
    <details
      className="group"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
        <span className="text-base font-semibold">
          Belum pernah menghitung begini? Lihat satu contoh yang sudah jadi
        </span>
        <span
          aria-hidden
          className="shrink-0 text-lg transition-transform group-open:rotate-45"
          style={{ color: "var(--blue-600)" }}
        >
          +
        </span>
      </summary>

      <div className="px-5 pb-5" style={{ borderTop: "1px solid var(--line)" }}>
        <p
          className="teks-rapi mt-4 text-base leading-relaxed"
          style={{ color: "var(--ink-dim)" }}
        >
          Satu gelas <strong style={{ color: "var(--ink)" }}>{CONTOH.menu}</strong> dijual{" "}
          {formatRupiah(CONTOH.harga)}. Kelihatannya untung besar — bahannya cuma teh dan
          gula. Ini hitungannya, langkah demi langkah.
        </p>

        <p className="label-kecil mt-5" style={{ color: "var(--ink-dim)" }}>
          Langkah 1 · ubah harga belanja jadi harga sekali pakai
        </p>
        <ol className="mt-2 flex flex-col">
          {CONTOH.bahan.map((b) => (
            <li
              key={b.nama}
              className="flex items-baseline justify-between gap-3 border-t py-2"
              style={{ borderColor: "var(--line)" }}
            >
              <span className="min-w-0">
                <span className="block text-sm">{b.nama}</span>
                <span className="tabular block text-xs" style={{ color: "var(--ink-dim)" }}>
                  {b.jumlah} {b.faktor ? `÷ ${b.faktor} ` : ""}× {b.harga}
                </span>
              </span>
              <span className="tabular shrink-0 text-sm">{formatRupiah(b.biaya)}</span>
            </li>
          ))}
        </ol>
        <p className="teks-rapi mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
          Harga di pasar selalu per kilo atau per liter, sedangkan yang masuk ke gelas cuma
          beberapa gram. Membagi dulu itulah langkah yang paling sering terlewat kalau
          dihitung di kepala.
        </p>

        <p className="label-kecil mt-5" style={{ color: "var(--ink-dim)" }}>
          Langkah 2 · jumlahkan
        </p>
        <div
          className="mt-2 flex items-baseline justify-between gap-3 pt-2"
          style={{ borderTop: "2px solid var(--orange)" }}
        >
          <span className="text-base font-semibold">Biaya bahan satu gelas</span>
          <span className="judul tabular text-xl">{formatRupiah(BIAYA)}</span>
        </div>

        <p className="label-kecil mt-5" style={{ color: "var(--ink-dim)" }}>
          Langkah 3 · kurangkan dari harga jual
        </p>
        <p className="tabular mt-2 text-base leading-relaxed">
          {formatRupiah(CONTOH.harga)} − {formatRupiah(BIAYA)} ={" "}
          <strong style={{ color: "var(--green)" }}>{formatRupiah(UNTUNG)}</strong> untung tiap
          gelas
        </p>
        <p className="teks-rapi mt-2 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
          Untungnya {formatRupiah(UNTUNG)} dari harga {formatRupiah(CONTOH.harga)}, jadi{" "}
          {MARGIN}% dari harga jual tinggal di laci. Angka {MARGIN}% itulah yang disebut{" "}
          <strong style={{ color: "var(--ink)" }}>margin</strong> di seluruh aplikasi ini —
          selalu bagian dari HARGA JUAL, bukan dari biaya bahan.
        </p>

        <p
          className="teks-rapi mt-5 px-3.5 py-3 text-sm leading-relaxed"
          style={{
            background: "var(--blue-wash)",
            borderRadius: "var(--radius-sm)",
            color: "var(--ink)",
          }}
        >
          Yang membuat hitungan ini berguna: es batu dan gelas plastik menghabiskan{" "}
          {formatRupiah(1150)} — lebih besar daripada teh dan gulanya sendiri. Bahan yang
          tidak terpikir itu yang biasanya menggerogoti untung, dan cuma kelihatan setelah
          semuanya ditulis satu per satu.
        </p>
      </div>
    </details>
  );
}
