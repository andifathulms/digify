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

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
      style={{
        background: aktif ? "var(--green-wash)" : "var(--red-wash)",
        color: aktif ? "var(--green)" : "var(--red)",
      }}
    >
      <span
        aria-hidden
        className="h-2 w-2 rounded-full"
        style={{ background: aktif ? "var(--green)" : "var(--red)" }}
      />
      {aktif ? "Server aktif" : "Server sedang gangguan"}
    </span>
  );
}
