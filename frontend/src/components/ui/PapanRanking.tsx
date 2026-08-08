import StatusPita, { warnaStatus } from "@/components/ui/StatusPita";
import { alasanStatus, RINGKASAN_ATURAN } from "@/lib/aturan";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { BarisRanking } from "@/lib/types/api";

/**
 * Papan ranking — elemen tanda tangan kedua produk ini.
 *
 * Kartu bernomor dengan pita status berwarna, bukan tabel. Di 360px tabel
 * data selalu berakhir jadi scroll horizontal, dan itu dilarang (PRD §4).
 * Persentase selalu didampingi nilai rupiahnya (PRD §3.3).
 *
 * Tiga besar dibedakan: nomornya berlatar biru pekat dan lebih besar. Papan
 * ini dibaca sambil berdiri di depan kompor — mata harus bisa menangkap
 * "tiga menu ini yang menghidupi warung" tanpa membaca satu angka pun.
 * Angka profitnya sendiri dinaikkan jadi baris tersendiri, karena itulah
 * satu-satunya alasan papan ini ada.
 */
export default function PapanRanking({ rankings }: { rankings: BarisRanking[] }) {
  if (rankings.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
        Belum ada menu untuk diurutkan. Isi daftar menu di atas dulu.
      </p>
    );
  }

  return (
    <div className="animasi-masuk flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
      {rankings.map((baris) => {
        const tigaBesar = baris.rank <= 3;
        const warna = warnaStatus(baris.status);

        return (
          <li
            key={`${baris.rank}-${baris.item}`}
            className="overflow-hidden"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-lg)",
              borderLeft: `5px solid ${warna}`,
              boxShadow: tigaBesar ? "var(--shadow)" : "var(--shadow-sm)",
            }}
          >
            <div className="flex items-start gap-3 p-4 sm:gap-4">
              <span
                aria-hidden
                className="judul tabular flex shrink-0 items-center justify-center"
                style={{
                  width: tigaBesar ? 40 : 34,
                  height: tigaBesar ? 40 : 34,
                  fontSize: tigaBesar ? "1.125rem" : "0.9375rem",
                  borderRadius: "var(--radius-sm)",
                  background: tigaBesar ? "var(--grad-panel)" : "var(--surface-2)",
                  color: tigaBesar ? "var(--on-dark)" : "var(--ink-dim)",
                  border: tigaBesar ? "none" : "1px solid var(--line)",
                }}
              >
                {baris.rank}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="judul-kecil text-base sm:text-lg">{baris.item}</h4>
                  <StatusPita status={baris.status} />
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="tabular text-xl leading-none font-semibold">
                    {formatRupiah(baris.weekly_profit)}
                  </span>
                  <span className="text-xs" style={{ color: "var(--ink-dim)" }}>
                    profit seminggu · margin{" "}
                    <span className="tabular font-semibold" style={{ color: "var(--ink)" }}>
                      {formatPersen(baris.margin_percentage)}
                    </span>
                  </span>
                </div>

                {baris.action ? (
                  <p
                    className="teks-rapi mt-3 px-3 py-2.5 text-sm leading-relaxed"
                    style={{
                      background: "var(--surface-2)",
                      borderRadius: "var(--radius-sm)",
                      borderLeft: `3px solid ${warna}`,
                    }}
                  >
                    {baris.action}
                  </p>
                ) : null}

                {/* Dasar vonisnya, memakai angka menu ini sendiri.
                 *
                 * <details> supaya tidak menambah kebisingan pada papan yang
                 * dibaca sambil berdiri: yang percaya lewat, yang curiga bisa
                 * membuka. Tertutup secara bawaan — pertanyaan "kenapa?" baru
                 * muncul setelah warnanya terlihat, bukan sebelum. */}
                <details className="group mt-2">
                  <summary
                    className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold"
                    style={{ color: "var(--blue-600)" }}
                  >
                    Kenapa {baris.status === "RED" ? "merah" : baris.status === "YELLOW" ? "kuning" : "hijau"}?
                    <span aria-hidden className="transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p
                    className="teks-rapi mt-2 text-sm leading-relaxed"
                    style={{ color: "var(--ink-dim)" }}
                  >
                    {alasanStatus(baris.status, baris.margin_percentage, baris.weekly_profit)}
                  </p>
                </details>
              </div>
            </div>
          </li>
        );
      })}
      </ol>

      {/* Aturannya ditulis terbuka, sekali, di bawah papan.
       *
       * Warna status adalah kesimpulan produk ini. Selama ambangnya
       * dirahasiakan, pemiliknya tidak punya cara menilai apakah ambang itu
       * masuk akal untuk warungnya — dan angka yang tidak bisa dinilai pada
       * akhirnya tidak dipakai. */}
      <div
        className="px-4 py-3.5"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
        }}
      >
        <p className="label-kecil" style={{ color: "var(--ink-dim)" }}>
          Dasar warnanya
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {RINGKASAN_ATURAN.map((baris) => (
            <li key={baris} className="text-sm leading-relaxed">
              {baris}
            </li>
          ))}
        </ul>
        <p className="teks-rapi mt-2.5 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
          Untung dihitung dari harga jual dikurangi biaya bahan, bukan dari omzet. Urutannya
          sendiri memakai profit seminggu — menu bermargin tipis tapi laris bisa menyumbang
          lebih banyak daripada menu bermargin tebal yang jarang laku.
        </p>
      </div>
    </div>
  );
}
