# DECISIONS

Catatan keputusan teknis (ADR ringan). Format: tanggal · keputusan · alasan · yang ditolak.
Ditulis supaya Owner (non-IT) dan developer berikutnya bisa mengerti kenapa sesuatu dibuat begini.

---

## 2026-07-28 · Prompt Gemini ditulis ulang dari spesifikasi, bukan disalin dari Express

**Keputusan.** Prompt untuk 9 endpoint ditulis berdasarkan `PRD.md` Bagian 5 dan
`docs/API_CONTRACT.md`, bukan disalin verbatim dari `routes/*.js` versi Express.

**Alasan.** Source code Express tidak ada di repo ini — hanya tiga dokumen
(`CLAUDE.md`, `PRD.md`, `API_CONTRACT.md`). Menyalin verbatim tidak mungkin dilakukan.

**Konsekuensi & tindak lanjut (WAJIB sebelum produksi).** `CLAUDE.md` §3.6 dan
`PRD.md` §12 menandai perbedaan prompt sebagai risiko regresi. Setiap file di
`backend/apps/optimizer/prompts/` diberi header `# TODO(port): bandingkan dengan routes/<nama>.js`.
Saat repo Express tersedia, ganti isi konstanta prompt dengan teks asli — struktur
kode tidak perlu berubah, hanya string-nya.

**Ditolak.** Menebak-nebak prompt lalu diam saja: risiko output berubah karakter
tanpa ada yang tahu.

---

## 2026-07-28 · `GEMINI_MODEL` default `gemini-2.5-flash`

**Keputusan.** Nilai default env `GEMINI_MODEL` diisi `gemini-2.5-flash`.

**Alasan.** Nama model tidak boleh hardcode (`CLAUDE.md` §6). Nilai persis dari `.env`
Express belum diverifikasi (`PRD.md` §12 menandainya sebagai risiko), jadi dipilih
model cepat + murah yang mendukung structured output, dan nilainya bisa diganti tanpa
menyentuh kode.

**Ditolak.** Membiarkan env kosong sampai diverifikasi — bikin `docker compose up`
gagal di mesin baru.

---

## 2026-07-28 · Structured output lewat `response_json_schema`, bukan parsing teks

**Keputusan.** Setiap panggilan Gemini mengirim JSON Schema eksplisit
(`apps/ai/schemas/`) dan membaca `response.text` sebagai JSON.

**Alasan.** `API_CONTRACT.md` menjamin bentuk respons lewat schema, bukan lewat parsing.
Tidak ada regex atas output model.

**Ditolak.** Free-text + regex — rapuh, dan bentuk respons jadi tidak bisa dites.

---

## 2026-07-28 · Kuota harian disimpan di Postgres, throttle burst di Redis

**Keputusan.** `DailyQuota` (Postgres) adalah sumber kebenaran kuota harian.
Redis hanya dipakai `ScopedRateThrottle` DRF untuk menahan klik ganda.

**Alasan.** `PRD.md` §0.e. Redis boleh hilang tanpa membuat kuota lifetime jebol.

**Ditolak.** Kuota murni di Redis — restart Redis = kuota semua user ter-reset.

---

## 2026-07-28 · `html2canvas-pro` untuk render slide carousel

**Keputusan.** Dependency baru `html2canvas-pro` ditambahkan ke `frontend/package.json`.

**Alasan.** `CLAUDE.md` §9.1: `html2canvas` versi asli tidak bisa mem-parse `oklch()`
yang dipakai Tailwind v4, hasilnya PNG hitam. `html2canvas-pro` mendukung `oklch`.
Sebagai lapis pengaman kedua, komponen slide juga memakai hex literal, bukan token Tailwind.

**Ditolak.** `html2canvas` asli (PNG rusak), `dom-to-image` (tidak terawat),
render server-side pakai Puppeteer (butuh container Chrome — berat, mahal di VPS kecil).

---

## 2026-07-28 · PNG carousel diunduh pada ukuran 1080×1350, bukan 5400×6750

**Keputusan.** `SKALA_TANGKAP = 1` di `frontend/src/components/carousel/unduh.ts`.
Node slide tetap dirender pada ukuran asli 1080×1350, lalu di-capture apa adanya.

**Alasan.** Ada pertentangan antar dokumen:
- `CLAUDE.md` §9.3 meminta node berukuran asli 1080×1350 **lalu** di-capture dengan
  `scale: 5`. Digabung, hasilnya PNG 5400×6750.
- `PRD.md` §9 Fase 3 menetapkan kriteria selesai: "PNG hasil download **benar-benar
  1080×1350**".

Kriteria PRD yang dipakai, karena itu yang bisa diuji dan itu ukuran yang memang
diminta Instagram. Node tetap dirender berukuran penuh sesuai CLAUDE.md, jadi teksnya
tetap tajam tanpa perlu pembesaran. PNG 5400px berukuran beberapa megabita — berat
diunduh dan dibagikan dari HP di koneksi lambat, padahal itu justru profil pengguna
kita (`PRD.md` §2).

**Terverifikasi.** Chromium sungguhan pada viewport 360px: PNG keluar 1080×1350,
~76 KB, warna sesuai Gaya C, dan slide penutup benar-benar biru penuh.

**Ditolak.** `scale: 5` apa adanya (PNG raksasa, melanggar kriteria PRD); mengecilkan
node sumber jadi 216×270 lalu `scale: 5` (teks jadi buram karena dirender pada ukuran
kecil, melanggar CLAUDE.md §9.3).

**Kalau Owner berubah pikiran:** ubah satu angka `SKALA_TANGKAP`.

---

## 2026-07-28 · Slide carousel dirender dua kali: satu untuk pratinjau, satu untuk capture

**Keputusan.** `PapanCarousel` merender tiap slide dua kali — satu di dalam kotak
pratinjau yang dikecilkan dengan `transform: scale()`, satu lagi di luar layar
(`position: fixed; left: -20000px`) pada ukuran asli. Yang di-capture selalu yang
di luar layar.

**Alasan.** html2canvas memakai posisi dan ukuran hasil layout, jadi
`transform: scale()` pada elemen mana pun **di atas** node yang di-capture ikut
terhitung: isinya mengecil ke sudut kiri atas dan sisa kanvas jadi polos.

Yang berbahaya: pada slide berlatar putih cacat ini **tidak kelihatan sama sekali** —
PNG-nya tetap 1080×1350 dan tetap putih. Ini baru ketahuan setelah slide penutup yang
berlatar biru ikut diuji dan keluar 92% putih.

**Ditolak.** Menaruh transform hanya di pembungkus terluar (sudah dicoba — leluhur
ber-transform tetap terhitung); menghapus pratinjau (user perlu melihat slidenya
sebelum mengunduh).

---

## 2026-07-28 · Token JWT disimpan di cookie httpOnly, di-set oleh Route Handler Next.js

**Keputusan.** Django mengeluarkan access/refresh token; Route Handler `/api/auth/*`
di Next.js yang menaruhnya sebagai cookie httpOnly.

**Alasan.** `PRD.md` §8.2. localStorage bisa dibaca skrip pihak ketiga (XSS).

**Ditolak.** Token di localStorage; Clerk (biaya bulanan, tidak butuh social login).
