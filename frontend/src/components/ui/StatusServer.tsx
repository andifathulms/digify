import { apiGet } from "@/lib/api";

type Health = { status: string; service: string };

/**
 * Badge "Server aktif". Server Component: dipanggil saat render halaman,
 * lewat jaringan Docker, tanpa membebani HP user.
 */
export default async function StatusServer() {
  let aktif = false;
  try {
    const health = await apiGet<Health>("/health");
    aktif = health.status === "ok";
  } catch {
    aktif = false;
  }

  const teks = aktif ? "Server aktif" : "Server sedang gangguan";

  return (
    // Di layar 360px, header berisi logo + status + tombol keluar. Teks
    // statusnya yang paling boleh dikorbankan: titik hijau sudah cukup
    // menyampaikan "beres", dan teks lengkapnya tetap dibacakan pembaca layar
    // lewat aria-label.
    <span
      aria-label={teks}
      className="inline-flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-semibold sm:px-3 sm:text-sm"
      style={{
        background: aktif ? "var(--green-wash)" : "var(--red-wash)",
        color: aktif ? "var(--green)" : "var(--red)",
      }}
    >
      <span
        aria-hidden
        className={`h-2 w-2 shrink-0 rounded-full ${aktif ? "" : "animate-pulse"}`}
        style={{ background: aktif ? "var(--green)" : "var(--red)" }}
      />
      <span aria-hidden className={aktif ? "hidden sm:inline" : "inline"}>
        {aktif ? teks : "Gangguan"}
      </span>
    </span>
  );
}
