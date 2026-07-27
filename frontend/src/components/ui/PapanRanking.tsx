import StatusPita, { warnaStatus } from "@/components/ui/StatusPita";
import { formatPersen, formatRupiah } from "@/lib/format";
import type { BarisRanking } from "@/lib/types/api";

/**
 * Papan ranking — elemen tanda tangan kedua produk ini.
 *
 * Kartu bernomor dengan pita status berwarna, bukan tabel. Di 360px tabel
 * data selalu berakhir jadi scroll horizontal, dan itu dilarang (PRD §4).
 * Persentase selalu didampingi nilai rupiahnya (PRD §3.3).
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
    <ol className="flex flex-col gap-3">
      {rankings.map((baris) => (
        <li
          key={`${baris.rank}-${baris.item}`}
          className="overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            borderLeft: `5px solid ${warnaStatus(baris.status)}`,
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-start gap-3 p-4">
            <span
              aria-hidden
              className="tabular flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
              style={{ background: "var(--blue-wash)", color: "var(--blue-deep)" }}
            >
              {baris.rank}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h4 className="text-base leading-snug font-semibold">{baris.item}</h4>
                <StatusPita status={baris.status} />
              </div>

              <p className="mt-2 text-sm" style={{ color: "var(--ink-dim)" }}>
                Profit seminggu{" "}
                <span className="tabular font-semibold" style={{ color: "var(--ink)" }}>
                  {formatRupiah(baris.weekly_profit)}
                </span>{" "}
                · margin{" "}
                <span className="tabular font-semibold" style={{ color: "var(--ink)" }}>
                  {formatPersen(baris.margin_percentage)}
                </span>
              </p>

              {baris.action ? (
                <p
                  className="mt-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm leading-relaxed"
                  style={{ background: "var(--bg)" }}
                >
                  {baris.action}
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
