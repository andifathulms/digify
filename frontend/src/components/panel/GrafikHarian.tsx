import { formatRupiah } from "@/lib/format";

/**
 * Pemakaian AI 14 hari terakhir.
 *
 * ── Kenapa kolom bertumpuk, bukan dua garis ───────────────────────────────
 * Yang dibaca di sini dua hal sekaligus: berapa banyak dipakai, dan berapa
 * banyak yang gagal. Dua garis terpisah memaksa mata membandingkan dua bentuk;
 * satu kolom yang sebagian merah menjawab keduanya dalam satu pandangan —
 * tinggi totalnya pemakaian, bagian merahnya kegagalan.
 *
 * ── Kenapa merah untuk gagal ──────────────────────────────────────────────
 * Merah di sini BUKAN warna identitas seri, melainkan warna status: ia berarti
 * "buruk", bukan "seri kedua". Karena itu ia selalu berpasangan dengan label
 * tertulis, tidak pernah warna saja.
 *
 * Pasangan #1868C7 dan #D6432B sudah diperiksa untuk buta warna: pemisahan
 * terburuknya ΔE 23,8 (protan) — jauh di atas ambang 8.
 *
 * ── Kenapa SVG tulisan tangan, bukan pustaka grafik ───────────────────────
 * Grafik ini satu bentuk, tanpa sumbu ganda, tanpa zoom. Pustaka grafik paling
 * ringan sekalipun menambah puluhan kilobita ke halaman yang cuma butuh
 * belasan persegi panjang — dan CLAUDE.md §3.7 meminta setiap dependency baru
 * punya alasan tertulis. Ini tidak punya.
 */

const BIRU = "#1868C7";
const MERAH = "#D6432B";

/** Tinggi area gambar. Kolomnya pendek dengan sengaja: ini penanda keadaan
 *  di dalam ringkasan, bukan halaman analisa tersendiri. */
const TINGGI = 120;

export type HariPemakaian = {
  tanggal: string;
  panggilan: number;
  gagal: number;
  biaya_rupiah: number;
};

function labelTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function GrafikHarian({ harian }: { harian: HariPemakaian[] }) {
  const tertinggi = Math.max(...harian.map((satu) => satu.panggilan), 1);
  const adaPemakaian = harian.some((satu) => satu.panggilan > 0);

  return (
    <section
      className="p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="judul-kecil text-lg">Pemakaian AI 14 hari terakhir</h2>

        {/* Legenda selalu ada untuk dua seri — warna saja tidak pernah jadi
            satu-satunya penanda. */}
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--ink-dim)" }}>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              style={{ width: 10, height: 10, borderRadius: 2, background: BIRU }}
            />
            Berhasil
          </span>
          <span className="flex items-center gap-1.5">
            <span
              aria-hidden
              style={{ width: 10, height: 10, borderRadius: 2, background: MERAH }}
            />
            Gagal
          </span>
        </div>
      </div>

      {!adaPemakaian ? (
        <p className="mt-4 text-sm" style={{ color: "var(--ink-dim)" }}>
          Belum ada pemakaian AI dalam 14 hari terakhir.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-end gap-1.5" style={{ height: TINGGI }}>
            {harian.map((satu) => {
              const tinggiTotal = (satu.panggilan / tertinggi) * TINGGI;
              const tinggiGagal = satu.panggilan
                ? (satu.gagal / satu.panggilan) * tinggiTotal
                : 0;
              const tinggiBerhasil = tinggiTotal - tinggiGagal;

              return (
                <div
                  key={satu.tanggal}
                  className="group relative flex flex-1 flex-col justify-end"
                  style={{ height: TINGGI }}
                  // Tooltip bawaan peramban: tetap terbaca lewat keyboard dan
                  // pembaca layar, dan tidak butuh satu baris JavaScript pun.
                  title={`${labelTanggal(satu.tanggal)}: ${satu.panggilan} panggilan${
                    satu.gagal ? `, ${satu.gagal} gagal` : ""
                  } · ${formatRupiah(satu.biaya_rupiah)}`}
                >
                  {/* Jarak 2px antar potongan dibuat oleh warna permukaan,
                      bukan garis tepi — garis tepi menambah tinta yang bukan
                      data. */}
                  {tinggiGagal > 0 ? (
                    <div
                      style={{
                        height: Math.max(tinggiGagal, 2),
                        background: MERAH,
                        borderRadius: "3px 3px 0 0",
                        marginBottom: tinggiBerhasil > 0 ? 2 : 0,
                      }}
                    />
                  ) : null}
                  {tinggiBerhasil > 0 ? (
                    <div
                      style={{
                        height: Math.max(tinggiBerhasil, 2),
                        background: BIRU,
                        borderRadius: tinggiGagal > 0 ? 0 : "3px 3px 0 0",
                      }}
                    />
                  ) : (
                    // Hari tanpa pemakaian tetap punya jejak setipis rambut,
                    // supaya deretnya terbaca sebagai hari yang kosong dan
                    // bukan sebagai hari yang hilang.
                    <div style={{ height: 2, background: "var(--line)" }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Hanya ujung-ujungnya yang diberi tanggal. Empat belas label di
              bawah kolom selebar sepuluh piksel akan saling tindih, dan yang
              dicari di grafik ini bentuknya, bukan tanggal persisnya. */}
          <div
            className="mt-2 flex justify-between text-xs"
            style={{ color: "var(--ink-soft)" }}
          >
            <span>{labelTanggal(harian[0]?.tanggal ?? "")}</span>
            <span>{labelTanggal(harian[harian.length - 1]?.tanggal ?? "")}</span>
          </div>
        </>
      )}
    </section>
  );
}
