# Menjalankan di Produksi

Ditulis supaya orang yang belum pernah menyentuh project ini bisa menaikkannya
dari nol di VPS bersih. Ikuti berurutan.

> **Ada jalan yang lebih pendek.** Bagian 1–2 di bawah membangun image DI server.
> `docs/DEPLOY_VPS.md` menggantinya: GitHub Actions yang membangun, server cukup
> `docker compose pull && up -d`, dan TLS diperpanjang sendiri. Itu yang saya
> sarankan. **Bagian 3–7 di berkas ini tetap berlaku dan tetap wajib** —
> uji restore, checklist keamanan, perawatan, dan §6.

---

## 0. Memilih tempat hosting

### GitHub Pages — tidak bisa, dan bukan soal ukuran

GitHub Pages hanya melayani berkas statis. Aplikasi ini butuh server yang hidup:

- **Route Handler Next.js** (`src/app/api/…`) yang memasang cookie httpOnly dan
  meneruskan permintaan ke Django. Ini bukan hiasan — dialah yang membuat token
  tidak pernah bisa dibaca JavaScript.
- **Server Component** yang memanggil backend sebelum halaman dikirim
  (mis. penjaga login di `/alat`).
- **Django + PostgreSQL + Redis** untuk akun, lisensi, kuota, dan daftar menu.

Mengubahnya jadi statis (`output: "export"`) akan mematikan ketiganya sekaligus,
dan model keamanannya ikut runtuh: tanpa server, token harus disimpan di tempat
yang bisa dibaca skrip. Jadi ini bukan langkah pertama yang lebih murah — ini
produk yang berbeda.

Yang sama gratisnya dan benar-benar bisa: **Vercel Hobby untuk uji coba pribadi**
(bukan komersial — ToS Vercel melarang), dengan backend di VPS kecil.

### Yang paling menentukan kecepatan: jarak server ke pembeli

Sejak Tab 1–6 dihitung sendiri, waktu prosesnya di bawah 250 milidetik. Artinya
yang dirasakan pengguna hampir seluruhnya **latensi jaringan**, bukan kecepatan
CPU server.

| Lokasi server | Perkiraan latensi dari Indonesia |
|---|---|
| Jakarta | 5–20 ms |
| Singapura | 15–40 ms |
| Eropa / AS | 200–350 ms |

Server Rp 500 ribu/bulan di Amerika akan terasa lebih lambat daripada server
Rp 100 ribu/bulan di Jakarta. **Pilih region dulu, baru pilih penyedia.**
(Tab 7–9 tetap 10–30 detik karena menunggu Gemini — lokasi server tidak
berpengaruh di situ.)

### Pilihan penyedia

| Penyedia | Region terdekat | Perkiraan | Catatan |
|---|---|---|---|
| **Biznet Gio / IDCloudHost / Rumahweb** | Jakarta | Rp 100–250 rb/bln | Bayar rupiah, dukungan Bahasa Indonesia. Paling nyaman untuk Owner non-IT |
| **Vultr** | Jakarta, Singapura | $6–12/bln | Ada region Jakarta, tagihan per jam |
| **DigitalOcean** | Singapura | $6–12/bln | Dokumentasi paling banyak |
| **Contabo** | Singapura | $7–9/bln | RAM paling besar per rupiah, performa kadang tidak stabil |
| **Alibaba Cloud** | Jakarta | bervariasi | Region Indonesia, penagihan lebih rumit |

### Tahap gratis sebelum ada pembeli: Oracle Cloud Always Free

**Oracle Cloud Always Free, region Singapura** — Ampere A1 ARM, 2 OCPU / 12 GB
(batas per Juni 2026), 200 GB disk, 10 TB lalu lintas per bulan, **Rp 0
selamanya**. Latensi Singapura→Indonesia 15–40 ms. Ini satu-satunya "gratis"
yang benar-benar muat menjalankan seluruh susunan ini; Fly.io sudah tidak punya
free tier, kredit Railway habis dalam dua minggu, dan Render free 512 MB tidak
cukup untuk Django + Postgres + Redis sekaligus.

Tiga syaratnya, dan ketiganya penting:

1. **Naikkan akun ke Pay As You Go.** Resource Always Free tetap Rp 0, tapi
   kebijakan *idle reclaim* (mematikan instance yang CPU-nya di bawah 20% selama
   7 hari) tidak lagi berlaku. Aplikasi yang belum punya pembeli pasti kena itu.
2. **Arsitekturnya ARM.** Sudah ditangani — workflow GHCR membangun arm64 dan
   amd64 sekaligus.
3. **Tidak ada SLA, tidak ada banding.** Akun free tier Oracle bisa ditutup
   tanpa penjelasan. Itu sebabnya ini untuk tahap pengembangan, **bukan** untuk
   menampung pembeli yang sudah membayar.

**Pindah ke VPS Jakarta sebelum pembeli pertama.** Bukan karena performa —
karena akuntabilitas. Rp 150 rb/bulan menghilangkan satu kelas risiko
sepenuhnya. Caranya ada di akhir `docs/DEPLOY_VPS.md`, dan karena semuanya
image, itu pekerjaan satu sore.

**Ukuran yang dibutuhkan.** Satu VPS menjalankan lima kontainer: PostgreSQL,
Redis, Django (3 worker Gunicorn), Next.js, dan Nginx.

- **Minimum: 2 vCPU / 4 GB RAM / 50 GB SSD.** Ini yang saya sarankan untuk mulai.
- 2 GB RAM cukup untuk mencoba, tapi mepet saat `docker compose build`.
- Jangan ambil 1 GB.

### Kapan naik kelas

| Pembeli aktif | Langkah |
|---|---|
| 0 – 500 | Satu VPS 2 vCPU / 4 GB. Tidak perlu apa-apa lagi |
| 500 – 3.000 | Naikkan ke 4 vCPU / 8 GB, tambah `GUNICORN_WORKERS` jadi 5–7 |
| 3.000 – 10.000 | Pindahkan PostgreSQL ke layanan terkelola atau VPS sendiri |
| 10.000+ | Dua server aplikasi di belakang load balancer; database terpisah |

Yang biasanya penuh lebih dulu bukan CPU, tapi **kuota Gemini dan tagihannya**.
Pantau `/admin/usage/dailyquota/` mingguan sebelum memikirkan server lebih besar.

### Kalau tetap ingin memakai Vercel

Bisa, untuk frontend saja — Django tidak cocok berjalan di sana. Browser memang
sudah tidak pernah menghubungi Django langsung, jadi caranya cuma mengarahkan
`BACKEND_INTERNAL_URL` ke alamat publik Django, dan set region fungsi Vercel ke
`sin1` (Singapura) supaya tidak menyeberang benua.

Biayanya jadi dua tempat: Vercel Pro $20/bln (Hobby tidak boleh untuk komersial)
+ VPS untuk Django. Dengan harga lifetime Rp 199–299 rb sekali bayar, itu berarti
sekitar tiga pembeli baru setiap bulan hanya untuk menutup hosting — selamanya,
tanpa pemasukan berulang di belakangnya. Satu VPS untuk semuanya jauh lebih aman
untuk model bisnis ini.

---

## 1. Yang perlu disiapkan

- VPS Linux (lihat Bagian 0) dengan Docker dan Docker Compose.
- Satu domain yang sudah diarahkan (A record) ke IP VPS.
- Kunci API Gemini.
- Rahasia webhook dari affiliate.id.
- **Cara mengirim kredensial ke pembeli** (email/WhatsApp) — lihat Bagian 6.

## 2. Naikkan aplikasinya

```bash
git clone <repo> digify-laris && cd digify-laris
cp .env.example .env
nano .env            # isi semua yang ditandai di bawah
```

Yang **wajib** diisi sebelum jalan:

| Variabel | Kenapa |
|---|---|
| `DJANGO_SECRET_KEY` | String acak panjang. Jangan pakai nilai contoh. |
| `DJANGO_ALLOWED_HOSTS` | Domain Anda, mis. `app.digify.id` |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | `https://app.digify.id` |
| `POSTGRES_PASSWORD` | Kata sandi kuat. Compose menolak jalan kalau kosong. |
| `GEMINI_API_KEY` | Kunci Gemini. Hanya hidup di container backend. |
| `GEMINI_MODEL` | **Verifikasi dari `.env` backend Express** sebelum jalan (PRD §12). |
| `AFFILIATE_ID_WEBHOOK_SECRET` | Tanpa ini semua webhook ditolak — dan itu memang disengaja. |
| `DAILY_AI_QUOTA` | Batas panggilan AI per user per hari. Awal: 50. |

Sertifikat TLS (sekali saja, dengan certbot di host):

```bash
sudo certbot certonly --standalone -d app.digify.id
mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/app.digify.id/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/app.digify.id/privkey.pem  nginx/certs/
```

Lalu:

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

Cek: buka `https://app.digify.id` — badge harus bertuliskan **"Server aktif"**.

## 3. Uji restore backup — WAJIB sebelum jual publik

Backup yang belum pernah diuji restore sama saja dengan tidak punya backup.
Lakukan sekali, catat hasilnya:

```bash
# Lihat backup yang sudah ada
ls -lh backups/

# Coba restore ke database sementara (TIDAK menyentuh data asli)
docker compose -f docker-compose.prod.yml exec db \
    createdb -U digify uji_restore
gunzip -c backups/digify-<tanggal>.sql.gz | \
    docker compose -f docker-compose.prod.yml exec -T db \
    psql -U digify -d uji_restore

# Pastikan datanya benar-benar ada
docker compose -f docker-compose.prod.yml exec db \
    psql -U digify -d uji_restore -c 'SELECT COUNT(*) FROM accounts_user;'

# Bersihkan
docker compose -f docker-compose.prod.yml exec db dropdb -U digify uji_restore
```

Kalau hitungan user-nya masuk akal, backup Anda benar-benar bisa dipakai.

## 4. Checklist keamanan

Periksa satu per satu sebelum menerima pembeli pertama:

- [ ] `DJANGO_SECRET_KEY` bukan nilai contoh, dan tidak pernah masuk git.
- [ ] `.env` tidak ada di git (`git check-ignore .env` harus mencetak `.env`).
- [ ] `DEBUG` mati — dijamin oleh `config/settings/prod.py`.
- [ ] `DJANGO_ALLOWED_HOSTS` berisi domain asli, bukan `*`.
- [ ] Postgres **tidak** punya `ports:` di `docker-compose.prod.yml`. Database
      tidak boleh bisa dihubungi dari internet.
- [ ] Redis juga tidak punya `ports:`.
- [ ] `GEMINI_API_KEY` tidak pernah muncul di bundle frontend:
      `docker compose -f docker-compose.prod.yml exec frontend grep -r "AIza" .next/ || echo "aman"`
- [ ] Tidak ada variabel `NEXT_PUBLIC_*` yang berisi rahasia.
- [ ] `AFFILIATE_ID_WEBHOOK_SECRET` terisi, dan webhook uji dengan tanda tangan
      salah benar-benar ditolak dengan 403.
- [ ] Timeout Nginx dan Gunicorn keduanya 120 detik. Default-nya (60 dan 30)
      akan memutus panggilan AI yang sebenarnya berhasil.
- [ ] Kuota harian aktif: coba lewati batas, harus dapat 429 berbahasa Indonesia.
- [ ] Backup berjalan (`ls backups/`) **dan** restore sudah pernah diuji.
- [ ] Sertifikat TLS berlaku, dan http dialihkan ke https.

## 5. Perawatan rutin

```bash
# Lihat log
docker compose -f docker-compose.prod.yml logs -f backend

# Lihat pemakaian AI per user
#   → https://app.digify.id/admin/usage/dailyquota/

# Perbarui aplikasi
git pull && docker compose -f docker-compose.prod.yml up -d --build

# Perpanjang sertifikat (certbot memperbarui, lalu salin ulang & muat ulang)
sudo certbot renew
sudo cp /etc/letsencrypt/live/app.digify.id/*.pem nginx/certs/
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

**Pantau biaya Gemini mingguan.** Model lifetime berarti pemasukan berhenti
tapi biaya jalan terus. Kalau rata-rata pemakaian mendekati batas harian,
tinjau lagi angka `DAILY_AI_QUOTA` (PRD §12).

---

## 6. Yang masih menghalangi penjualan publik

Bagian 1–5 membuat aplikasinya HIDUP. Empat hal di bawah membuatnya LAYAK DIJUAL.
Urutannya sudah disusun dari yang paling menghalangi.

### 6.1 🔴 Pembeli tidak akan pernah menerima kata sandinya

Webhook membuat akun lalu mengembalikan kata sandi awal **di dalam respons HTTP
ke affiliate.id**. Tidak ada satu baris pun kode yang mengirim email atau
WhatsApp — tidak ada konfigurasi SMTP di project ini.

Artinya hari ini: orang bayar → akun jadi → dia tidak pernah tahu kata sandinya →
tidak bisa masuk.

`PRD.md` §8.1 memang mencantumkan "Kirim kredensial ke pembeli" dan §12
menandainya sebagai keputusan yang belum diambil. Jadi ini sengaja ditunda,
bukan terlewat — tapi tetap harus selesai sebelum pembeli pertama.

**Butuh keputusan Owner: email, WhatsApp, atau keduanya?**

| Cara | Biaya | Catatan |
|---|---|---|
| Email (SMTP / Resend / Brevo) | gratis–murah | Paling cepat dipasang |
| WhatsApp (Fonnte, Wablas) | Rp 100–200 rb/bln | Jauh lebih mungkin dibaca pemilik warung |

Saran: pasang email lebih dulu supaya bisa jualan, tambahkan WhatsApp setelah
ada pembeli — tapi ini keputusan biaya, jadi milik Owner.

**Penambal sementara:** jalankan `manage.py buat_akun` lalu kirim kredensialnya
manual. Sanggup untuk sepuluh pembeli pertama, tidak untuk seratus.

### 6.2 Belum pernah ada satu pun panggilan Gemini sungguhan

Seluruh test memalsukan Gemini. Tab 7–10 belum pernah berjalan sungguhan.
Bersamaan dengan itu, dua risiko di `PRD.md` §12 masih terbuka dan keduanya
butuh kunci API yang sama:

- `GEMINI_MODEL` sekarang `gemini-3.5-flash`. Yang lama (`gemini-2.5-flash`)
  ditarik Google untuk kunci API baru dan mematikan Tab 7-10 di produksi pada
  11 Agustus 2026 — lihat docs/DECISIONS.md. Nilainya masih belum dicocokkan
  dengan `.env` backend Express.
- Tiga prompt masih ditulis dari spesifikasi, bukan disalin verbatim —
  `menu_ideas.py`, `marketing_content.py`, `carousel_content.py`. Enam sisanya
  ikut terhapus waktu tabnya jadi berbasis aturan.

### 6.3 Belum pernah dideploy sama sekali

Bagian 1–5 sudah ditulis lengkap tapi belum pernah dijalankan di server sungguhan.
Uji restore backup (Bagian 3) juga belum pernah dilakukan, padahal `PRD.md` §10
mensyaratkannya minimal sekali sebelum jual publik.

### 6.4 Frontend belum punya test otomatis

Backend punya 281 test. Frontend nol. Carousel PNG, alur login, dan keenam tab
aturan sudah saya buktikan di Chromium sungguhan — tapi manual, dan tidak ada
yang menjaganya kalau nanti ada perubahan.

---

## 7. Urutan menuju publik

1. **Putuskan cara kirim kredensial** (§6.1) — ini keputusan Owner, bukan teknis.
2. Pasang pengiriman kredensial, lalu uji dengan webhook palsu dari ujung ke ujung.
3. Isi `GEMINI_API_KEY`, verifikasi `GEMINI_MODEL`, jalankan Tab 7–10 sungguhan,
   bandingkan keluarannya dengan versi Express (§6.2).
4. Sewa VPS (§0), jalankan Bagian 1–2, pasang TLS.
5. Jalankan uji restore backup (§3) — catat hasilnya.
6. Kerjakan checklist keamanan (§4) satu per satu.
7. Uji beli sungguhan: bayar di affiliate.id dengan nominal terkecil, pastikan
   kredensial benar-benar sampai, lalu masuk dan pakai satu tab AI.
8. Baru umumkan.

Langkah 7 yang paling sering dilewati, dan justru itu satu-satunya yang menguji
seluruh rantai — pembayaran, webhook, pembuatan akun, pengiriman kredensial,
login, sampai pemakaian.
