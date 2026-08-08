/**
 * Ambang aturan yang menentukan status menu — CERMIN dari backend.
 *
 * Sumber kebenarannya `backend/apps/optimizer/features/ranking.py`. Nilai di
 * sini digandakan, dan penggandaan selalu bisa melenceng — karena itu ada
 * `test_ambang_cocok_dengan_frontend` di backend yang gagal kalau angkanya
 * berbeda, dengan pesan yang menyebut nama berkas ini. Kalau test itu merah,
 * yang salah adalah berkas ini, bukan test-nya.
 *
 * Kenapa digandakan, bukan dikirim lewat response: `docs/API_CONTRACT.md`
 * mengikat, dan menambah field ke response adalah perubahan kontrak yang
 * butuh persetujuan Owner (CLAUDE.md §10). Tripwire di backend memberi
 * jaminan yang sama tanpa menyentuh kontrak.
 *
 * ── Kenapa ini perlu ditampilkan sama sekali ───────────────────────────────
 * Sejak 28 Juli 2026 seluruh Profit Engine dihitung aturan sendiri, dan
 * alasan nomor dua di `docs/DECISIONS.md` berbunyi: "Kalau dia bertanya
 * 'kenapa menu ini disuruh dihentikan?', jawabannya bisa ditunjuk angkanya,
 * bukan 'karena AI bilang'." Sampai sekarang jawaban itu ada di dalam kode
 * tapi tidak pernah sampai ke layar — pita status muncul sebagai vonis tanpa
 * dasar. Pemilik warung yang tidak tahu apa arti MERAH akan memilih jalan
 * paling aman: mengabaikannya.
 */

import type { StatusMenu } from "@/lib/types/api";

/** Di bawah ini harga sudah terlalu dekat dengan modal. */
export const AMBANG_MARGIN_RUGI = 20;

/** Di bawah ini masih untung, tapi tipis. */
export const AMBANG_MARGIN_SEHAT = 40;

/**
 * Seberapa jauh harga digeser ke arah harga kompetitor — cermin
 * `BOBOT_KOMPETITOR` di `features/pricing.py`.
 *
 * Dipakai untuk MENERANGKAN, bukan untuk menghitung: angka yang ditampilkan
 * tetap yang dikirim backend. Tangga penjelasnya hanya ditampilkan kalau
 * susunan ulang di sini berakhir pada angka yang sama persis (lihat
 * PenjelasanHarga di Tab 2), jadi kalau nilai ini melenceng dari backend yang
 * terjadi adalah penjelasannya menghilang — bukan penjelasan yang salah.
 */
export const BOBOT_KOMPETITOR = 0.5;

/** Harga jual selalu dibulatkan naik ke kelipatan ini. */
export const KELIPATAN_HARGA = 500;

/**
 * Status dari margin dan untung — cermin `_status()` di ranking.py.
 *
 * Dipakai penggeser harga di Tab 2 supaya warnanya berarti persis sama dengan
 * warna di papan ranking. Kalau penggesernya memakai ambang sendiri, dua layar
 * akan menyebut menu yang sama dengan dua warna berbeda, dan yang rusak bukan
 * cuma tampilannya — melainkan kepercayaan pada dua-duanya.
 */
export function statusDariMargin(margin: number, untung: number): StatusMenu {
  if (untung <= 0 || margin < AMBANG_MARGIN_RUGI) return "RED";
  if (margin < AMBANG_MARGIN_SEHAT) return "YELLOW";
  return "GREEN";
}

/**
 * Kalimat yang menerangkan kenapa satu menu mendapat statusnya, memakai angka
 * menu itu sendiri — bukan penjelasan umum tentang apa arti warna merah.
 *
 * Dua sebab RED sengaja dibedakan. "Rugi tiap porsi" dan "untungnya cuma 12%"
 * adalah dua masalah berbeda dengan dua tindakan berbeda, dan menyamakan
 * keduanya di balik satu kata membuat sarannya terasa asal.
 */
export function alasanStatus(
  status: StatusMenu,
  margin: number,
  profitMingguan: number,
): string {
  const marginTertulis = `${margin.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;

  if (status === "RED") {
    return profitMingguan <= 0
      ? `Merah karena menu ini tidak menghasilkan untung sama sekali dalam seminggu — harga jualnya belum menutup biaya bahan.`
      : `Merah karena untungnya ${marginTertulis}, di bawah ${AMBANG_MARGIN_RUGI}%. Pada jarak setipis ini, harga bahan naik sedikit saja menu ini langsung rugi.`;
  }

  if (status === "YELLOW") {
    return `Kuning karena untungnya ${marginTertulis} — masih untung, tapi di bawah ${AMBANG_MARGIN_SEHAT}%. Biasanya ini soal harga, bukan soal menunya.`;
  }

  return `Hijau karena untungnya ${marginTertulis}, sudah di atas ${AMBANG_MARGIN_SEHAT}%. Menu seperti ini tidak perlu diutak-atik harganya — yang membantu justru menjualnya lebih banyak.`;
}

/** Ringkasan aturannya, ditampilkan sekali di bawah papan ranking. */
export const RINGKASAN_ATURAN = [
  `Hijau — untung ${AMBANG_MARGIN_SEHAT}% ke atas.`,
  `Kuning — untung ${AMBANG_MARGIN_RUGI}–${AMBANG_MARGIN_SEHAT}%.`,
  `Merah — untung di bawah ${AMBANG_MARGIN_RUGI}%, atau tidak untung sama sekali.`,
];
