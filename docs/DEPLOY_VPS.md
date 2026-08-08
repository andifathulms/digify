# Deploy: dari push ke main sampai hidup di server

Cara kerjanya: **Anda push ke main → GitHub Actions membangun image → server
menariknya.** Server tidak pernah menyimpan kode sumber, tidak pernah
menjalankan `git clone`, dan tidak pernah membangun apa pun.

Yang ada di server hanya dua berkas:

```
/opt/digify/
├── docker-compose.yml     ← salinan docker-compose.deploy.yml
├── .env                   ← salinan .env.deploy.example, sudah diisi
└── backups/               ← dibuat sendiri
```

Perawatan sehari-hari jadi satu baris:

```bash
docker compose pull && docker compose up -d
```

> Bagian 1–7 di sini menggantikan `PRODUKSI.md` Bagian 1–2 (yang membangun
> image di server). Bagian 3–7 PRODUKSI.md — uji restore, checklist keamanan,
> perawatan, dan §6 "yang masih menghalangi penjualan" — tetap berlaku dan
> tetap wajib.

---

## Bagian 1 — Sisi GitHub (10 menit)

**1.1 Dorong berkas barunya.**

```bash
git add .github .env.deploy.example docker-compose.deploy.yml \
        nginx/Dockerfile nginx/.dockerignore scripts/Dockerfile \
        backend/.dockerignore docs/DEPLOY_VPS.md
git commit -m "ci: bangun image ke GHCR dan compose khusus deploy"
git push
```

**1.2 Isi alamat halaman pembayaran.**

`Settings → Secrets and variables → Actions → Variables → New repository variable`

| Nama | Isi |
|---|---|
| `NEXT_PUBLIC_URL_BELI` | alamat halaman bayar affiliate.id, mis. `https://digify.affiliate.id/laris` |

Kosongkan kalau belum ada — tombolnya akan turun ke bagian "Cara mulai", bukan
rusak. **Nilai ini dijahit saat build**, jadi mengubahnya nanti berarti
menjalankan ulang workflow (`Actions → Bangun image ke GHCR → Run workflow`).

**1.3 Tunggu buildnya.** Buka tab `Actions`. Build pertama 15–30 menit karena
arm64 dibangun lewat emulasi dan belum ada cache. Build berikutnya 3–8 menit.

**1.4 Pastikan keempat paketnya jadi.** Buka profil GitHub → `Packages`. Harus
ada `digify-backend`, `digify-frontend`, `digify-nginx`, `digify-backup`.

**1.5 Buat token supaya server bisa menarik.** Repo privat berarti paketnya
juga privat.

`Settings (akun) → Developer settings → Personal access tokens → Tokens (classic)
→ Generate new token` — centang **`read:packages`** saja. Simpan tokennya;
GitHub hanya menampilkannya sekali.

> Alternatif: di halaman tiap paket → `Package settings` → `Change visibility`
> → Public. Server tidak perlu login sama sekali. Aman — image ini tidak berisi
> rahasia (`.env` tidak pernah ikut, dijaga `.dockerignore`) — tapi siapa pun
> bisa membaca kode aplikasi Anda dari dalamnya. Untuk sekarang saya sarankan
> tetap privat.

---

## Bagian 2 — Server Oracle Cloud (30 menit, sekali saja)

**2.1 Daftar** di [cloud.oracle.com](https://cloud.oracle.com/) → **Start for free**.

- **Home Region: Singapore (ap-singapore-1).** Ini tidak bisa diubah setelah
  akun jadi, dan region inilah yang menentukan latensi ke pembeli Anda.
- Kartu kredit diminta untuk verifikasi. Ditahan ~$1 lalu dikembalikan.

**2.2 Naikkan ke Pay As You Go.** `Billing → Upgrade and Manage Payment`.
Resource Always Free tetap **Rp 0** — yang hilang cuma kebijakan *idle reclaim*
yang mematikan instance kalau CPU-nya di bawah 20% selama 7 hari. Aplikasi yang
belum punya pembeli pasti kena itu. Pasang **budget alert Rp 0** di
`Billing → Budgets` supaya kalau suatu saat keluar dari batas gratis, Anda tahu
di hari yang sama.

**2.3 Buat instance.** `Compute → Instances → Create instance`.

| Kolom | Isi |
|---|---|
| Image | Canonical **Ubuntu 24.04** |
| Shape | `VM.Standard.A1.Flex` (Ampere, ARM) |
| OCPU / Memory | **2 OCPU / 12 GB** — batas Always Free per Juni 2026 |
| Boot volume | 100 GB (gratis sampai 200 GB) |
| SSH key | Generate, lalu **unduh private key-nya** |

Kalau muncul "Out of host capacity", ganti Availability Domain, atau coba lagi
beberapa jam kemudian. Ini normal di region populer.

Catat **Public IP**-nya.

**2.4 Buka port di security list.** `Networking → Virtual Cloud Networks →
[VCN Anda] → Subnets → [subnet] → Security Lists → Default → Add Ingress Rules`:

| Source CIDR | Protocol | Destination Port |
|---|---|---|
| `0.0.0.0/0` | TCP | 80 |
| `0.0.0.0/0` | TCP | 443 |

**2.5 Buka port di dalam Ubuntu-nya juga.** Ini jebakan Oracle yang paling
sering makan waktu berjam-jam: image Ubuntu-nya punya aturan iptables sendiri
yang membuang paket 80/443, jadi web-nya tetap tidak bisa diakses walau security
list sudah benar.

```bash
ssh -i kunci.key ubuntu@<IP-PUBLIK>

sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

**2.6 Pasang Docker.**

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
exit            # keluar lalu ssh lagi supaya keanggotaan grup berlaku
```

---

## Bagian 3 — Domain

Di penyedia domain Anda, buat satu **A record**:

| Nama | Tipe | Nilai |
|---|---|---|
| `app` (atau `@`) | A | IP publik dari langkah 2.3 |

Tunggu sampai benar (dari laptop): `dig +short app.digify.id` harus mencetak
IP-nya. **Jangan lanjut ke Bagian 6 sebelum ini benar** — Let's Encrypt
memverifikasi lewat DNS, dan lima kali gagal berturut-turut kena jeda satu jam.

---

## Bagian 4 — Pasang berkasnya

```bash
sudo mkdir -p /opt/digify && sudo chown ubuntu:ubuntu /opt/digify
cd /opt/digify
mkdir -p backups
```

Salin dua berkas dari laptop:

```bash
# jalankan di laptop, dari folder project
scp -i kunci.key docker-compose.deploy.yml ubuntu@<IP>:/opt/digify/docker-compose.yml
scp -i kunci.key .env.deploy.example       ubuntu@<IP>:/opt/digify/.env
```

Lalu isi `.env` di server:

```bash
nano /opt/digify/.env
```

Yang **wajib** terisi sebelum jalan: `GHCR_OWNER`, `DIGIFY_DOMAIN`,
`LETSENCRYPT_EMAIL`, `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`,
`DJANGO_CSRF_TRUSTED_ORIGINS`, `POSTGRES_PASSWORD`, `GEMINI_API_KEY`,
`AFFILIATE_ID_WEBHOOK_SECRET`.

Untuk `DJANGO_SECRET_KEY`: `openssl rand -base64 48`.

---

## Bagian 5 — Nyalakan

```bash
cd /opt/digify

# Sekali saja: token dari langkah 1.5, tempel saat diminta password
echo "<TOKEN-GITHUB>" | docker login ghcr.io -u <NAMA-AKUN-GITHUB> --password-stdin

docker compose pull
docker compose up -d
docker compose ps        # semuanya harus "running"
```

Uji tanpa TLS dulu: `curl -I http://<IP-PUBLIK>` harus menjawab `301`. Kalau
menggantung, kembali ke langkah 2.5.

> Nginx sudah bisa hidup walau sertifikat asli belum ada, karena image-nya
> membawa sertifikat sementara bertanda tangan sendiri. Browser akan
> memperingatkan — itu wajar sampai Bagian 6 selesai.

---

## Bagian 6 — Sertifikat TLS asli

```bash
cd /opt/digify

docker compose run --rm --entrypoint certbot certbot certonly \
    --webroot -w /var/www/certbot \
    -d app.digify.id \
    --email anda@email.com --agree-tos --no-eff-email --non-interactive

# Salin ke tempat yang dibaca Nginx
docker compose run --rm --entrypoint sh certbot \
    -c 'cp -L /etc/letsencrypt/live/$DIGIFY_DOMAIN/*.pem /certs/'

docker compose exec nginx nginx -s reload
```

Ganti `app.digify.id` dan alamat emailnya dengan milik Anda.

Perpanjangan setelah ini **otomatis**: kontainer `certbot` memeriksa tiap 12 jam
dan menyalin sendiri hasilnya, dan Nginx memuat ulang tiap 12 jam. Tidak ada
cron di host, tidak ada yang perlu diingat.

Buka `https://app.digify.id` — badge harus bertuliskan **"Server aktif"**.

---

## Bagian 7 — Akun admin

```bash
docker compose exec backend python manage.py createsuperuser
```

Lalu lanjutkan ke **`PRODUKSI.md` Bagian 3** (uji restore backup — wajib) dan
**Bagian 4** (checklist keamanan). Satu penyesuaian pada checklist itu:
perintah `docker compose -f docker-compose.prod.yml …` diganti
`docker compose …` saja, karena di sini berkasnya sudah bernama
`docker-compose.yml`.

---

## Perawatan sehari-hari

```bash
cd /opt/digify

# Terapkan perubahan yang sudah selesai dibangun Actions
docker compose pull && docker compose up -d

# Lihat log
docker compose logs -f backend

# Buang image lama yang menumpuk
docker image prune -f
```

**Rollback.** Setiap build juga menerbitkan tag `sha-<commit>`. Kalau versi
terbaru bermasalah:

```bash
nano .env                 # IMAGE_TAG=sha-<commit-yang-baik>
docker compose pull && docker compose up -d
```

Ini alasan tag `sha-` ada. Kembali ke `latest` setelah perbaikannya masuk main.

**Backup keluar server.** Backup yang hanya ada di server yang sama dengan
databasenya tidak menolong saat servernya yang hilang. Jalankan dari laptop:

```bash
rsync -avz -e "ssh -i kunci.key" ubuntu@<IP>:/opt/digify/backups/ ./backups-server/
```

---

## Pindah ke VPS Jakarta nanti

Karena semuanya image, pindahan bukan proyek — ini urutannya:

1. Sewa VPS Jakarta 2 vCPU / 4 GB (Biznet Gio, IDCloudHost).
2. Ulangi Bagian 2.6, 4, 5 di server baru. **Jangan** jalankan Bagian 6 dulu.
3. Salin backup terakhir dari server lama, restore ke database baru.
4. Pindahkan A record ke IP baru, tunggu DNS menyebar.
5. Baru jalankan Bagian 6 (certbot butuh domain sudah menunjuk ke sini).
6. Matikan server Oracle setelah seminggu tenang — jangan langsung dihapus.

Image `linux/amd64` sudah dibangun berdampingan dengan arm64, jadi tidak ada
yang perlu di-build ulang.
