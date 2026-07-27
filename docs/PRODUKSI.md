# Menjalankan di Produksi

Ditulis supaya orang yang belum pernah menyentuh project ini bisa menaikkannya
dari nol di VPS bersih. Ikuti berurutan.

---

## 1. Yang perlu disiapkan

- VPS Linux dengan Docker dan Docker Compose.
- Satu domain yang sudah diarahkan (A record) ke IP VPS.
- Kunci API Gemini.
- Rahasia webhook dari affiliate.id.

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
