import type { ReactNode } from "react";

/**
 * Keadaan menunggu, gagal, dan kosong.
 *
 * Tiga aturan yang dipegang di sini:
 * 1. Jujur soal tunggu — ke DUA arah. Panggilan AI makan 10–30 detik dan itu
 *    harus disebut, karena spinner telanjang membuat user mengira aplikasinya
 *    hang lalu menekan tombol berulang kali. Tapi Tab 1–6 sekarang dihitung
 *    sendiri dan selesai di bawah seperempat detik; menjanjikan "10–30 detik"
 *    di situ sama tidak jujurnya, jadi pesan bawaannya tidak menyebut waktu
 *    sama sekali dan tab AI yang mengisinya sendiri.
 * 2. Pesan gagal ditampilkan APA ADANYA dari backend. Frontend tidak pernah
 *    mengarang teks errornya sendiri (CLAUDE.md §7).
 * 3. Keadaan kosong memberi tahu langkah berikutnya dalam satu kalimat.
 */

/**
 * Menunggu.
 *
 * Di bawah pesannya ada kerangka hasil (skeleton) yang berkilau. Fungsinya
 * bukan hiasan: ia menempati ruang setinggi hasil yang akan datang, jadi
 * halaman tidak melompat saat hasil masuk, dan bentuknya memberi tahu user
 * bahwa yang datang nanti adalah struk berisi baris-baris angka.
 */
export function SedangMenghitung({ pesan }: { pesan?: string }) {
  return (
    <div className="animasi-masuk flex flex-col gap-4">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 px-4 py-4"
        style={{
          background: "var(--blue-wash)",
          color: "var(--blue-800)",
          border: "1px solid var(--blue-100)",
          borderRadius: "var(--radius)",
        }}
      >
        <span
          aria-hidden
          className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current"
          style={{ borderTopColor: "transparent" }}
        />
        <p className="text-sm leading-relaxed font-semibold">{pesan ?? "Sedang menghitung…"}</p>
      </div>

      <div
        aria-hidden
        className="flex flex-col gap-3 p-5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div className="kerangka mx-auto h-5 w-1/2" />
        <div className="kerangka h-3 w-full" />
        <div className="kerangka h-3 w-5/6" />
        <div className="kerangka h-3 w-2/3" />
        <div className="kerangka mt-2 h-7 w-2/5 self-end" />
      </div>
    </div>
  );
}

export function PesanGagal({ pesan }: { pesan: string }) {
  return (
    <div
      role="alert"
      className="animasi-masuk flex items-start gap-3 px-4 py-4"
      style={{
        background: "var(--red-wash)",
        color: "var(--red)",
        border: "1px solid rgb(214 67 43 / 22%)",
        borderRadius: "var(--radius)",
      }}
    >
      <span
        aria-hidden
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ background: "var(--red)", color: "var(--on-dark)" }}
      >
        !
      </span>
      {/* Teks datang dari backend, sudah berbahasa Indonesia dan menenangkan. */}
      <p className="teks-rapi text-sm leading-relaxed font-medium">{pesan}</p>
    </div>
  );
}

export function KeadaanKosong({ children }: { children: ReactNode }) {
  return (
    <div
      className="px-5 py-8 text-center"
      style={{
        background: "var(--surface)",
        border: "1px dashed var(--line-strong)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <p
        className="teks-rapi mx-auto max-w-sm text-sm leading-relaxed"
        style={{ color: "var(--ink-dim)" }}
      >
        {children}
      </p>
    </div>
  );
}
