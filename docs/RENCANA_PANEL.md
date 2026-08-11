# Rencana Panel Admin

Dokumen rencana untuk panel pengawasan pembeli. Ditulis 11 Agustus 2026.

Pembacanya dua orang: Owner (non-IT) dan developer. Bagian "kenapa" ditulis
supaya keputusan di sini bisa dipahami ulang setahun lagi, saat alasannya sudah
lupa.

---

## 1. Masalah yang diselesaikan

Model bisnisnya lifetime: pembeli membayar sekali Rp199.000–299.000, lalu
memakai AI setiap hari selamanya. Setiap panggilan menambah tagihan Gemini.
Tanpa alat pengawas, tiga hal berikut tidak terlihat sampai sudah telanjur:

1. **Pembeli yang gagal dapat akun.** Webhook pembayaran gagal → orang sudah
   membayar tapi tidak pernah menerima kredensial. Sunyi, dan berujung marah.
2. **Layanan AI yang mati.** 11 Agustus 2026 Tab 7–10 mati berjam-jam karena
   model ditarik Google. Yang menemukan adalah Owner sendiri, tidak sengaja,
   lewat DevTools. Tidak ada satu pun tanda yang sampai.
3. **Pembeli yang biayanya melebihi yang ia bayar.** Tidak ada tempat untuk
   melihat siapa.

Panel ini menjawab tiga hal itu lebih dulu, sebelum yang lain.

---

## 2. Enam pertanyaan yang harus dijawab

Panel disusun mengikuti pertanyaan, bukan mengikuti tabel database.

| # | Pertanyaan | Sumber data |
|---|---|---|
| 1 | Ada pembeli yang gagal dapat akun? | `WebhookEvent` gagal / belum diproses |
| 2 | Layanan AI sehat sekarang? | Rasio error `UsageLog` per endpoint |
| 3 | Tiap pembeli menghabiskan berapa rupiah? | `UsageLog.prompt_tokens/output_tokens` |
| 4 | Siapa yang pemakaiannya tidak wajar? | Pemakaian harian & bulanan |
| 5 | Siapa yang sudah bayar tapi belum pernah masuk? | `must_change_password`, `last_login` |
| 6 | Berapa uang masuk? | `License` per status & bulan |

---

## 3. Peran

Hari ini penggunanya dua orang, jadi perannya dua.

| Peran | Siapa | Boleh | Tidak boleh |
|---|---|---|---|
| **Owner** | superuser | semua | — |
| **Operasional** | `is_staff` + grup `Operasional` | lihat & urus pembeli, lisensi, pemakaian; tambah jatah kuota | hapus pembeli, ubah izin, belanja AI tanpa batas |

Peran CS dan Keuangan **sengaja belum dibuat**. Menambahkannya nanti cukup satu
entri di `apps/accounts/peran.py` — tanpa migrasi, tanpa mengubah kode lain.
Grup kosong yang belum dipakai hanya menambah yang harus dibaca saat menebak
siapa boleh apa.

**Akses admin bukan izin belanja.** Kuota dilewati lewat izin
`usage.bypass_quota`, bukan lewat `is_staff`. Sebelum 11 Agustus 2026 keduanya
menyatu, sehingga memberi seseorang akses admin ikut memberinya belanja AI tanpa
batas — diam-diam, pada hari aksesnya diberikan.

---

## 4. Keputusan teknis

**Otentikasi memakai sesi yang sudah ada** (JWT di cookie httpOnly), dengan
penjagaan berbasis izin di setiap endpoint. Bukan login admin terpisah:
login kedua berarti permukaan otentikasi kedua yang harus dijaga aman, dan
CLAUDE.md §10 menandai perubahan model auth sebagai hal yang harus ditanyakan
lebih dulu. Memakai ulang menghindari keduanya.

**Penjagaan sesungguhnya ada di backend.** Setiap endpoint panel memeriksa izin
sendiri. Pemeriksaan di frontend hanya supaya menu yang pasti gagal tidak
ditampilkan — itu kenyamanan, bukan keamanan.

**Django admin tetap ada.** Ia jalan keluar mentah yang tetap berguna: menyunting
`License`, membaca `payload` webhook. Panel menjawab pertanyaan harian; admin
menangani yang jarang dan aneh. Menghapusnya tidak menguntungkan siapa pun.

**Path baru di bawah `/api/panel/`.** Kontrak 9 endpoint optimizer di
`docs/API_CONTRACT.md` tidak disentuh sama sekali.

**Biaya adalah perkiraan, bukan pembukuan.** Dihitung dari token tercatat
dikali harga per juta token di setelan. Tagihan Google yang berlaku.

---

## 5. Tahapan

| Tahap | Isi | Status |
|---|---|---|
| A | Pisah `is_staff` dari `bypass_quota`; catat token; grup peran | **selesai** (11 Agu 2026) |
| B | Endpoint `/api/panel/*`: ringkasan, daftar klien, detail klien | |
| C | Tindakan: tambah jatah kuota, reset kata sandi, buat akun manual, cabut lisensi | |
| D | Halaman `/admin` di Next.js | |
| E | Pemberitahuan otomatis: webhook gagal, lonjakan error AI | |

Tahap E yang seharusnya menangkap kejadian 11 Agustus. Ia ditaruh terakhir
bukan karena paling tidak penting, melainkan karena butuh yang di atasnya lebih
dulu.

---

## 6. Yang sengaja TIDAK dikerjakan sekarang

- **Grafik dan tren.** Angka hari ini dan bulan ini sudah menjawab keenam
  pertanyaan. Grafik menambah pekerjaan tanpa menambah keputusan.
- **Ekspor CSV.** Belum ada yang memintanya. Django admin sudah bisa jadi jalan
  keluar sementara.
- **Backfill biaya lama.** 22 baris `UsageLog` sebelum 11 Agustus 2026 tidak
  punya catatan token. Menebaknya justru membuat angka lama terlihat pasti
  padahal karangan. Laporan biaya dimulai dari tanggal itu.
