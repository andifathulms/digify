"use client";

import type { PetaFoto } from "@/components/carousel/fotoSlide";
import { PesanGagal } from "@/components/ui/Keadaan";

/**
 * Pemilih foto yang duduk DI ATAS tombol "Buatkan gambar carousel".
 *
 * ── Kenapa sebelum tombol, bukan sesudah hasil ────────────────────────────
 * Unggah foto sudah ada sejak awal, tapi letaknya di papan slide — yang baru
 * muncul setelah pembuatan selesai. Orang yang sedang menimbang produknya
 * berhenti jauh sebelum itu dan menyimpulkan fotonya dibuatkan mesin. Fitur
 * yang tidak terlihat sama saja dengan fitur yang tidak ada.
 *
 * ── Kenapa berbentuk slot, bukan satu tombol unggah ───────────────────────
 * Carousel bukan satu gambar, dan orang perlu tahu bahwa foto yang ia pilih
 * pergi ke slide tertentu. Slot kosong bernomor menerangkan itu tanpa satu
 * kalimat pun, sekaligus menunjukkan bahwa dilewat pun tidak apa-apa.
 *
 * Satu jendela pilih berkas bisa mengambil beberapa foto sekaligus, karena
 * membuka pemilih berkas empat kali di HP adalah empat kesempatan menyerah.
 */

export default function PilihFoto({
  jumlahSlide,
  foto,
  galat,
  onPilihBanyak,
  onPilihSatu,
  onHapus,
}: {
  jumlahSlide: number;
  foto: PetaFoto;
  galat: string | null;
  onPilihBanyak: (berkas: FileList | null) => void;
  onPilihSatu: (nomor: number, berkas: File | undefined) => void;
  onHapus: (nomor: number) => void;
}) {
  const nomorSlide = Array.from({ length: Math.max(jumlahSlide, 1) }, (_, i) => i + 1);
  const terisi = nomorSlide.filter((nomor) => foto[nomor]).length;

  return (
    <div
      className="mt-5 rounded-[var(--radius)] p-4"
      style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-base font-semibold">Foto masakan Anda</h3>
        <span className="tabular text-xs" style={{ color: "var(--ink-soft)" }}>
          {terisi} dari {nomorSlide.length} slide
        </span>
      </div>

      <p className="teks-rapi mt-1.5 text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
        Pakai foto warung Anda sendiri — tidak ada foto yang dibuatkan mesin. Boleh dilewat: slide
        tanpa foto tetap rapi dan tetap bisa diposting.
      </p>

      {/* Satu tombol untuk mengambil beberapa foto sekaligus. Slot yang sudah
          terisi tidak diganggu — lihat isiSlotKosong di fotoSlide.ts. */}
      <label
        className="label-isian mt-3.5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-sm)] px-5 text-sm font-semibold"
        style={{
          minHeight: "var(--tap)",
          background: "var(--surface)",
          border: "1px solid var(--line-strong)",
          color: "var(--ink)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        Pilih foto dari HP
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            onPilihBanyak(event.target.files);
            // Dikosongkan supaya memilih berkas yang sama lagi tetap memicu
            // onChange — kalau tidak, foto yang barusan dihapus tidak bisa
            // dipilih ulang.
            event.target.value = "";
          }}
        />
      </label>

      <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {nomorSlide.map((nomor) => {
          const adaFoto = Boolean(foto[nomor]);

          return (
            <li key={nomor} className="flex flex-col gap-1.5">
              <label
                className="relative block cursor-pointer overflow-hidden"
                style={{
                  aspectRatio: "4 / 5",
                  borderRadius: "var(--radius-xs)",
                  background: adaFoto ? "var(--surface)" : "var(--cream)",
                  border: `1px ${adaFoto ? "solid" : "dashed"} var(--line-strong)`,
                }}
              >
                {adaFoto ? (
                  /* <img> polos, bukan next/image: sumbernya data URL dari HP
                     pengguna, tidak ada yang bisa dioptimalkan di server. */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={foto[nomor]}
                    alt={`Foto untuk slide ${nomor}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="tabular flex h-full w-full items-center justify-center text-sm font-semibold"
                    style={{ color: "var(--ink-soft)" }}
                  >
                    {nomor}
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label={
                    adaFoto ? `Ganti foto slide ${nomor}` : `Pilih foto untuk slide ${nomor}`
                  }
                  onChange={(event) => {
                    onPilihSatu(nomor, event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>

              <span className="text-center text-xs" style={{ color: "var(--ink-soft)" }}>
                Slide {nomor}
              </span>

              {/* Nomor slide-nya ikut di nama tombol. Empat tombol bernama
                  "Hapus" yang persis sama membuat daftar tombol di pembaca
                  layar jadi empat entri kembar. Nomornya tertulis persis di
                  atas tombol, jadi di sini cukup dibacakan. */}
              {adaFoto ? (
                <button
                  type="button"
                  onClick={() => onHapus(nomor)}
                  className="cursor-pointer text-xs font-semibold"
                  style={{ color: "var(--red)", minHeight: "var(--tap)" }}
                >
                  Hapus
                  <span className="sr-only"> foto slide {nomor}</span>
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>

      {galat ? (
        <div className="mt-3">
          <PesanGagal pesan={galat} />
        </div>
      ) : null}
    </div>
  );
}
