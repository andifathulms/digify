"use client";

import { warnaStatus } from "@/components/ui/StatusPita";
import { AMBANG_MARGIN_RUGI, AMBANG_MARGIN_SEHAT, statusDariMargin } from "@/lib/aturan";
import { formatPersen, formatRupiah } from "@/lib/format";
import { angkaSah, useUrlState } from "@/lib/useUrlState";

/**
 * "Kalau harga bahan naik sekian persen, menu ini masih untung tidak?"
 *
 * ── Pertanyaan yang selama ini tidak bisa dijawab ──────────────────────────
 * Tiap aturan di `aturan/` adalah uji ambang, dan tiap uji ambang menghitung
 * JARAK ke tepinya lalu membuangnya. Aplikasi bisa memberi tahu posisi hari
 * ini; ia tidak pernah bisa memberi tahu seberapa dekat tepi jurangnya.
 *
 * Padahal dunia pemakainya justru itu: cabai naik dua kali lipat, ayam
 * bergerak tiap minggu. Dan satu angka margin tidak mengajarkan apa pun soal
 * ketahanan — dua menu yang sama-sama bermargin 45% bisa berkelakuan sangat
 * berbeda saat harga bahan naik 20%, tergantung seberapa besar porsi biaya
 * bahan di dalam harganya.
 *
 * ── Kenapa penggeser, bukan kalimat ───────────────────────────────────────
 * Yang perlu dipahami bukan satu angka melainkan BENTUK hubungannya: untung
 * turun lebih cepat daripada kenaikan bahannya, dan ada titik di mana warnanya
 * berubah. Kalimat bisa menyebut titik itu; menggeser sendiri sampai ke sana
 * membuatnya masuk akal.
 *
 * Seluruhnya aritmetika di browser, memakai ambang yang sama dengan papan
 * ranking — jadi warna di sini berarti persis sama dengan warna di sana.
 */

const KENAIKAN_MAKS = 100;
const LANGKAH = 5;

export default function PenggeserKenaikanBahan({
  biayaBahan,
  hargaJual,
}: {
  biayaBahan: number;
  hargaJual: number;
}) {
  const [naik, setNaik] = useUrlState("naik", 0, angkaSah);
  const persen = Math.min(Math.max(naik, 0), KENAIKAN_MAKS);

  if (biayaBahan <= 0 || hargaJual <= 0) return null;

  const biayaBaru = Math.round(biayaBahan * (1 + persen / 100));
  const untung = hargaJual - biayaBaru;
  const margin = hargaJual > 0 ? (untung / hargaJual) * 100 : 0;
  const warna = warnaStatus(statusDariMargin(margin, untung));

  // Kenaikan terkecil yang membuat menu ini rugi (untung <= 0), dan yang
  // membuatnya masuk wilayah merah (margin < ambang rugi). Dicari dengan
  // menaikkan selangkah demi selangkah memakai rumus yang sama seperti di
  // atas — bukan dibalik lewat aljabar — supaya angka yang ditunjuk pasti
  // angka yang benar-benar akan muncul kalau penggesernya digeser ke sana.
  let titikKuning: number | null = null;
  let titikMerah: number | null = null;
  let titikRugi: number | null = null;
  for (let p = 0; p <= KENAIKAN_MAKS; p += LANGKAH) {
    const b = Math.round(biayaBahan * (1 + p / 100));
    const u = hargaJual - b;
    const m = (u / hargaJual) * 100;
    if (titikKuning === null && m < AMBANG_MARGIN_SEHAT) titikKuning = p;
    if (titikMerah === null && (u <= 0 || m < AMBANG_MARGIN_RUGI)) titikMerah = p;
    if (titikRugi === null && u <= 0) titikRugi = p;
  }

  return (
    <div
      className="px-4 py-4 sm:px-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <p className="text-sm font-semibold">Seberapa kuat menu ini kalau harga bahan naik?</p>
      <p className="teks-rapi mt-1.5 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        Margin hari ini tidak memberi tahu seberapa dekat menu ini ke tepi. Geser untuk
        melihatnya.
      </p>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="judul tabular text-xl" style={{ color: warna }}>
          Untung {formatRupiah(untung)}
        </p>
        <p className="tabular text-base font-semibold" style={{ color: warna }}>
          margin {formatPersen(margin)}
        </p>
      </div>

      <div className="mt-3 px-2">
        <input
          type="range"
          min={0}
          max={KENAIKAN_MAKS}
          step={LANGKAH}
          value={persen}
          onChange={(event) => setNaik(Number(event.target.value))}
          aria-label="Kenaikan harga bahan"
          aria-valuetext={`Harga bahan naik ${persen} persen, untung ${formatRupiah(untung)}, margin ${formatPersen(margin)}`}
          className="block w-full cursor-pointer"
          style={{ accentColor: warna, minHeight: "var(--tap)" }}
        />
      </div>
      <div className="flex justify-between px-2 text-2xs" style={{ color: "var(--ink-soft)" }}>
        <span className="tabular">naik 0%</span>
        <span className="tabular">naik {KENAIKAN_MAKS}%</span>
      </div>

      <p className="tabular mt-3 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        Bahan naik {persen}% → {formatRupiah(biayaBahan)} jadi {formatRupiah(biayaBaru)}, harga
        jual tetap {formatRupiah(hargaJual)}
      </p>

      <div
        className="mt-3 flex flex-col gap-1 pt-3 text-sm leading-relaxed"
        style={{ borderTop: "1px dotted var(--line-dotted)" }}
      >
        {titikKuning === null ? (
          <p>
            Bahkan kalau harga bahan naik {KENAIKAN_MAKS}%, untung menu ini masih di atas{" "}
            {AMBANG_MARGIN_SEHAT}%.
          </p>
        ) : (
          <p>
            Untungnya mulai menipis saat harga bahan naik{" "}
            <strong style={{ color: "var(--yellow)" }}>{titikKuning}%</strong>
            {titikMerah !== null ? (
              <>
                , jadi terlalu tipis di{" "}
                <strong style={{ color: "var(--red)" }}>{titikMerah}%</strong>
              </>
            ) : null}
            {titikRugi !== null ? (
              <>
                , dan menu ini mulai <strong style={{ color: "var(--red)" }}>rugi</strong> di{" "}
                {titikRugi}%
              </>
            ) : null}
            .
          </p>
        )}
        <p style={{ color: "var(--ink-dim)" }}>
          Yang digeser hanya biaya bahan; harga jual dianggap tetap. Kalau harga jualnya ikut
          dinaikkan, ceritanya lain — itu yang dihitung di alat Harga Jual.
        </p>
      </div>
    </div>
  );
}
