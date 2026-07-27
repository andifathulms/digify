# Digify Laris — Menu Optimizer

Alat berbasis AI untuk pemilik usaha F&B kecil di Indonesia: menghitung profit asli per menu,
lalu membuatkan konten promosi siap posting.

- Produk & bisnis → [`PRD.md`](PRD.md)
- Kontrak endpoint (mengikat) → [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md)
- Catatan keputusan teknis → [`docs/DECISIONS.md`](docs/DECISIONS.md)
- Instruksi untuk Claude Code → [`CLAUDE.md`](CLAUDE.md)

## Stack

Django 5 + DRF (Python 3.12) · Next.js 15 + React 19 + TypeScript · PostgreSQL 16 · Redis · Docker Compose

## Menjalankan (development)

```bash
cp .env.example .env          # isi GEMINI_API_KEY
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:8000/api/health
- Admin:    http://localhost:8000/admin

Migrasi dijalankan otomatis saat container backend start. Untuk membuat akun admin:

```bash
docker compose exec backend python manage.py createsuperuser
```

Untuk membuat akun tester (tanpa webhook pembayaran):

```bash
docker compose exec backend python manage.py buat_akun budi@warung.id --nama "Pak Budi"
```

## Perintah harian

```bash
# Backend
docker compose exec backend pytest
docker compose exec backend ruff check . && docker compose exec backend ruff format .
docker compose exec backend python manage.py makemigrations

# Frontend
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run build
```

Jangan pernah `pip install` / `npm install` di host. Tambahkan ke `backend/pyproject.toml`
atau `frontend/package.json`, lalu `docker compose up --build`.

Kalau migrasi kusut: `docker compose down -v` lalu `docker compose up --build`.

## Produksi

```bash
cp .env.example .env          # isi nilai produksi, DJANGO_DEBUG=0
docker compose -f docker-compose.prod.yml up -d --build
```

Nginx melayani frontend di `/` dan mem-proxy `/api` ke backend (satu origin, CORS tidak dipakai).
Timeout diset 120 detik karena panggilan AI wajar memakan 10–30 detik.

## Struktur

```
backend/apps/ai/          panggilan Gemini terpusat (retry + terjemahan error)
backend/apps/optimizer/   9 endpoint AI — satu modul per fitur
backend/apps/accounts/    User, License, webhook affiliate.id
backend/apps/usage/       UsageLog, DailyQuota, throttle
backend/apps/catalog/     MenuItem tersimpan (dipakai bersama antar tab)
frontend/src/app/         App Router — landing, /masuk, /alat (10 tab)
frontend/src/components/  ui/ · tools/ · carousel/
```
