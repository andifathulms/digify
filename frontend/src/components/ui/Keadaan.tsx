import type { ReactNode } from "react";

/**
 * Keadaan menunggu, gagal, dan kosong.
 *
 * Tiga aturan yang dipegang di sini:
 * 1. Jujur soal tunggu. Panggilan AI makan 10–30 detik; spinner telanjang
 *    membuat user mengira aplikasinya hang, lalu menekan tombol berulang kali.
 * 2. Pesan gagal ditampilkan APA ADANYA dari backend. Frontend tidak pernah
 *    mengarang teks errornya sendiri (CLAUDE.md §7).
 * 3. Keadaan kosong memberi tahu langkah berikutnya dalam satu kalimat.
 */

export function SedangMenghitung({ pesan }: { pesan?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-[var(--radius)] px-4 py-4"
      style={{ background: "var(--blue-wash)", color: "var(--blue-deep)" }}
    >
      <span
        aria-hidden
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
      <p className="text-sm leading-relaxed font-medium">
        {pesan ?? "Sedang menghitung… bisa 10–30 detik. Jangan tutup halaman ini."}
      </p>
    </div>
  );
}

export function PesanGagal({ pesan }: { pesan: string }) {
  return (
    <div
      role="alert"
      className="rounded-[var(--radius)] px-4 py-4"
      style={{ background: "var(--red-wash)", color: "var(--red)" }}
    >
      {/* Teks datang dari backend, sudah berbahasa Indonesia dan menenangkan. */}
      <p className="text-sm leading-relaxed font-medium">{pesan}</p>
    </div>
  );
}

export function KeadaanKosong({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[var(--radius)] px-4 py-6 text-center"
      style={{ background: "var(--surface)", border: "1px dashed var(--line)" }}
    >
      <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        {children}
      </p>
    </div>
  );
}
