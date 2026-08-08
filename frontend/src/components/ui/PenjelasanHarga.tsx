import { BOBOT_KOMPETITOR, KELIPATAN_HARGA } from "@/lib/aturan";
import { formatPersen, formatRupiah } from "@/lib/format";

/**
 * Tangga yang menerangkan dari mana harga yang disarankan berasal.
 *
 * ── Yang disembunyikan sebelumnya ──────────────────────────────────────────
 * `dine_in_recommended` adalah hasil empat langkah (features/pricing.py):
 *   1. titik impas — biaya bahannya sendiri
 *   2. harga dari target margin: biaya ÷ (100% − margin)
 *   3. KALAU harga kompetitor lebih tinggi, naik SEPARUH jarak ke sana
 *   4. dibulatkan naik ke kelipatan 500
 *
 * Struknya hanya menampilkan langkah 1 dan hasil akhir. Langkah 3 yang paling
 * perlu diterangkan: mengisi "harga warung sebelah" diam-diam menggeser
 * jawabannya sejauh separuh selisih, dan hanya pernah ke ATAS. Alasannya
 * bagus dan sudah tertulis di komentar backend — "menyamai persis berarti
 * bertaruh bahwa warung sebelah sudah menghitung dengan benar, belum tentu" —
 * tapi kalimat itu tidak pernah sampai ke layar. Pemakainya mengetik sebuah
 * angka di isian opsional, jawabannya berubah, dan tidak ada apa pun yang
 * menghubungkan keduanya.
 *
 * Ini juga persis kebiasaan yang produk ini ada untuk melawan ("harga
 * ditentukan ikut warung sebelah", PRD §1) — dikerjakan setengahnya atas nama
 * pemakainya, tanpa memberitahunya.
 *
 * ── Kenapa disusun ulang, bukan dikirim backend ────────────────────────────
 * Nilai antaranya tidak ada di response, dan menambah field adalah perubahan
 * kontrak yang butuh persetujuan Owner (CLAUDE.md §10). Jadi tangga ini
 * disusun ulang di sini dari masukan yang memang sudah ada di klien — LALU
 * DICOCOKKAN dengan angka yang dikirim backend. Kalau hasilnya berbeda
 * sedikit pun, seluruh penjelasan tidak ditampilkan.
 *
 * Itu pilihan yang disengaja: penjelasan yang meleset dari angkanya sendiri
 * lebih merusak daripada tidak ada penjelasan. Yang gagal adalah
 * penjelasannya, bukan angkanya.
 */
export default function PenjelasanHarga({
  biayaBahan,
  targetMargin,
  hargaKompetitor,
  hargaDisarankan,
}: {
  biayaBahan: number;
  targetMargin: number;
  hargaKompetitor: number;
  /** Angka resmi dari backend. Tangga ini harus berakhir persis di sini. */
  hargaDisarankan: number;
}) {
  if (biayaBahan <= 0 || targetMargin <= 0 || targetMargin >= 100) return null;

  const dariMargin = biayaBahan / (1 - targetMargin / 100);
  const ikutKompetitor =
    hargaKompetitor > dariMargin
      ? dariMargin + (hargaKompetitor - dariMargin) * BOBOT_KOMPETITOR
      : dariMargin;
  const dibulatkan = Math.ceil(ikutKompetitor / KELIPATAN_HARGA) * KELIPATAN_HARGA;

  // Pagar: kalau susunan ulang ini tidak mendarat di angka yang sama dengan
  // backend, diam. Lihat catatan di kepala berkas.
  if (dibulatkan !== hargaDisarankan) return null;

  const kompetitorMenggeser = ikutKompetitor > dariMargin;

  const langkah = [
    {
      label: "Biaya bahan per porsi",
      rumus: "yang Anda isi di atas",
      nilai: biayaBahan,
    },
    {
      label: `Harga untuk margin ${formatPersen(targetMargin)}`,
      rumus: `${formatRupiah(biayaBahan)} ÷ (100% − ${formatPersen(targetMargin)})`,
      nilai: Math.round(dariMargin),
    },
    ...(kompetitorMenggeser
      ? [
          {
            label: "Disesuaikan ke harga warung sebelah",
            rumus: `naik separuh jarak ke ${formatRupiah(hargaKompetitor)}`,
            nilai: Math.round(ikutKompetitor),
          },
        ]
      : []),
    {
      label: "Dibulatkan naik",
      rumus: `ke kelipatan ${formatAngkaKelipatan()}`,
      nilai: dibulatkan,
    },
  ];

  return (
    <div
      className="px-4 py-4 sm:px-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <p className="text-sm font-semibold">Dari mana angka {formatRupiah(hargaDisarankan)} ini</p>

      <ol className="mt-3 flex flex-col">
        {langkah.map((baris, indeks) => (
          <li
            key={baris.label}
            className="flex items-baseline justify-between gap-3 py-2"
            style={{ borderTop: indeks === 0 ? "none" : "1px dotted var(--line-dotted)" }}
          >
            <span className="min-w-0">
              <span className="block text-sm">{baris.label}</span>
              <span className="tabular block text-xs" style={{ color: "var(--ink-dim)" }}>
                {baris.rumus}
              </span>
            </span>
            <span className="tabular shrink-0 text-sm font-semibold">
              {formatRupiah(baris.nilai)}
            </span>
          </li>
        ))}
      </ol>

      {kompetitorMenggeser ? (
        <p
          className="teks-rapi mt-3 px-3.5 py-3 text-sm leading-relaxed"
          style={{
            background: "var(--surface-2)",
            borderRadius: "var(--radius-sm)",
            color: "var(--ink-dim)",
          }}
        >
          <span className="font-semibold" style={{ color: "var(--ink)" }}>
            Kenapa cuma separuh jalan:
          </span>{" "}
          menyamai harga warung sebelah persis berarti bertaruh bahwa mereka sudah menghitung
          biayanya dengan benar — belum tentu. Harga mereka dipakai untuk menaikkan saja,
          tidak pernah menurunkan: kalau mereka menjual di bawah biaya Anda, mengikutinya
          berarti ikut rugi.
        </p>
      ) : (
        <p className="teks-rapi mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
          Harga warung sebelah tidak dipakai kali ini — ia tidak lebih tinggi dari harga yang
          sudah keluar dari target margin Anda. Harga mereka hanya dipakai untuk menaikkan,
          tidak pernah menurunkan.
        </p>
      )}
    </div>
  );
}

function formatAngkaKelipatan(): string {
  return new Intl.NumberFormat("id-ID").format(KELIPATAN_HARGA);
}
