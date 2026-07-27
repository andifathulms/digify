/**
 * Satu-satunya pintu ke backend.
 *
 * Aturan (CLAUDE.md §7): tidak ada `fetch` telanjang di dalam komponen.
 * Base URL, kredensial, timeout, dan normalisasi error hidup di sini saja.
 *
 * Pesan error TIDAK PERNAH dikarang di frontend — kalau backend mengirim
 * {"error": "..."} dalam Bahasa Indonesia, itu yang ditampilkan apa adanya.
 */

/** Panggilan AI wajar memakan 10–30 detik; beri ruang sampai 90 detik. */
const TIMEOUT_MS = 90_000;

const PESAN_KONEKSI =
  "Koneksi ke server terputus. Periksa internet Anda, lalu coba lagi.";
const PESAN_TERLALU_LAMA = "Prosesnya terlalu lama, coba lagi sebentar lagi.";
const PESAN_UMUM = "Belum berhasil. Coba ulangi sebentar lagi ya.";

/** Error yang pesannya sudah siap ditampilkan ke user, dalam Bahasa Indonesia. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function baseUrl(): string {
  // Di server (Server Component / Route Handler) panggil lewat jaringan Docker.
  if (typeof window === "undefined") {
    const internal = process.env.BACKEND_INTERNAL_URL;
    if (internal) return `${internal.replace(/\/$/, "")}/api`;
  }
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");
}

async function bacaPesanError(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    if (data && typeof data === "object" && "error" in data) {
      const pesan = (data as { error: unknown }).error;
      if (typeof pesan === "string" && pesan.trim() !== "") return pesan;
    }
  } catch {
    // Body bukan JSON (mis. halaman error dari proxy). Pakai pesan umum.
  }
  return PESAN_UMUM;
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      ...init,
      credentials: "include",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch (error) {
    const dibatalkan = error instanceof DOMException && error.name === "AbortError";
    throw new ApiError(dibatalkan ? PESAN_TERLALU_LAMA : PESAN_KONEKSI, 0);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new ApiError(await bacaPesanError(response), response.status);
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET", cache: "no-store" });
}

export function apiPost<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  return request<TResponse>(path, { method: "POST", body: JSON.stringify(body) });
}

/** Ambil pesan siap tampil dari error apa pun yang sampai ke komponen. */
export function pesanError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return PESAN_UMUM;
}
