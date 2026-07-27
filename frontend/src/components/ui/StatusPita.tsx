import type { StatusMenu } from "@/lib/types/api";

/**
 * Pita status GREEN / YELLOW / RED.
 *
 * Labelnya Bahasa Indonesia, bukan nama statusnya. User tidak perlu tahu
 * bahwa backend menyebutnya "GREEN" — yang perlu dia tahu adalah menu ini
 * layak dipertahankan.
 */

const TAMPILAN: Record<StatusMenu, { label: string; warna: string; latar: string }> = {
  GREEN: { label: "Pertahankan", warna: "var(--green)", latar: "var(--green-wash)" },
  YELLOW: { label: "Perbaiki harga", warna: "var(--yellow)", latar: "var(--yellow-wash)" },
  RED: { label: "Perlu ditinjau", warna: "var(--red)", latar: "var(--red-wash)" },
};

export default function StatusPita({ status }: { status: StatusMenu }) {
  const tampilan = TAMPILAN[status] ?? TAMPILAN.YELLOW;

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: tampilan.latar, color: tampilan.warna }}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tampilan.warna }}
      />
      {tampilan.label}
    </span>
  );
}

export function warnaStatus(status: StatusMenu): string {
  return (TAMPILAN[status] ?? TAMPILAN.YELLOW).warna;
}
