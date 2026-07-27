# PRD — Digify Laris: Menu Optimizer

| | |
|---|---|
| **Produk** | Digify Laris — Menu Optimizer |
| **Brand induk** | Digify.ID · AI Tools ("Digital. Make Simple") |
| **Versi dokumen** | **v2.0 — Engineering-ready** (turunan dari PRD v1.0 milik Owner) |
| **Tanggal** | 27 Juli 2026 |
| **Stack target** | Django REST Framework · Next.js (App Router) + React · PostgreSQL · Docker |
| **Status build** | Backend Express + Frontend HTML **SUDAH JADI & tervalidasi** (10 fitur end-to-end). Dokumen ini adalah rencana **porting ke stack baru**. |

> **Cara baca.** PRD v1.0 adalah sumber kebenaran **produk & bisnis** — semua isinya dipertahankan. Dokumen v2.0 ini menambahkan lapisan **arsitektur & rencana eksekusi teknis** untuk stack Django + Next.js + PostgreSQL + Docker, menggantikan rencana Next.js-fullstack/Vercel/Clerk/Supabase di v1.0 Bagian 8.
> Tanda: `[BERUBAH]` = keputusan teknis yang berbeda dari v1.0. `[TETAP]` = tidak berubah.

---

## 0. Ringkasan Perubahan Teknis dari v1.0

PRD v1.0 merencanakan Next.js fullstack di Vercel. Stack yang dipilih sekarang memisahkan backend dan frontend. Ini konsekuensinya:

| Hal | Rencana v1.0 | Keputusan v2.0 | Alasan |
|---|---|---|---|
| Backend | Next.js Route Handlers | **Django + DRF** `[BERUBAH]` | Backend jadi service terpisah; logika AI, kuota, dan billing hidup di satu tempat berbahasa Python |
| Frontend | Next.js (sama-sama) | **Next.js App Router + React + TypeScript** `[TETAP]` | Sesuai rencana; sekarang murni frontend + BFF tipis |
| Database | Supabase (Postgres) | **PostgreSQL di Docker** `[BERUBAH]` | Self-host, tanpa vendor lock, satu `docker compose up` untuk seluruh tim |
| Auth | Clerk | **DRF SimpleJWT + license key** `[BERUBAH]` | Model bisnis lifetime tidak butuh social login/organizations. Akun dibuat otomatis oleh webhook, bukan self-signup. Menghemat biaya bulanan & satu vendor |
| Deploy | Vercel | **Docker Compose di VPS** (Nginx + Gunicorn/Uvicorn) `[BERUBAH]` | Django tidak cocok di Vercel; satu VPS cukup untuk skala awal |
| Rate limit | belum diputuskan | **Tabel `UsageLog` + DRF throttle (+ Redis opsional)** `[BERUBAH]` | Postgres sudah ada sejak hari-1, tidak perlu layanan tambahan |
| Bahasa | JS/TS belum diputuskan | **TypeScript (frontend) + Python type hints (backend)** `[BERUBAH]` | Owner non-IT; tipe = dokumentasi hidup & mengurangi bug saat handover |
| Penamaan field campur EN–ID | Dibiarkan untuk v1 | **Dibiarkan, dikunci lewat kontrak API** `[TETAP]` | Sesuai keputusan Owner. Kontrak dikunci di `docs/API_CONTRACT.md` + test |

**Jawaban atas pertanyaan `[UNTUK ANDI]` di v1.0 Bagian 8:**

- **a. Pola porting endpoint** → Satu modul Python per fitur di `apps/optimizer/features/`, di-expose sebagai `APIView` DRF. Path & bentuk JSON **identik** dengan Express.
- **b. Struktur project** → Satu repo (monorepo ringan): `backend/`, `frontend/`, `docker-compose.yml`. Bukan monorepo tooling (Nx/Turbo) — tidak sepadan untuk 2 service.
- **c. Database** → PostgreSQL 16 di Docker. Supabase tidak dipakai.
- **d. Auth** → SimpleJWT + license key dari webhook. Clerk tidak dipakai. (Jika suatu saat butuh login sosial, Clerk bisa dipasang di depan tanpa mengubah model data.)
- **e. Rate limit** → Tabel `UsageLog` + `ScopedRateThrottle` DRF. Redis dipasang di compose sejak awal (dipakai untuk cache & throttle burst), tapi sumber kebenaran kuota tetap Postgres.
- **f. TypeScript atau JavaScript** → TypeScript, strict mode.
- **g. `html2canvas`** → Komponen client-only (`dynamic(..., { ssr: false })`). Ada jebakan warna `oklch` — lihat Bagian 7.4.

---

## 1. Ringkasan Produk `[TETAP]`

Digify Laris — Menu Optimizer adalah alat berbasis AI yang membantu pemilik usaha F&B kecil di Indonesia (warung, kedai, kafe, UMKM kuliner) mengetahui **menu mana yang benar-benar menghasilkan uang**, lalu membantu mereka menaikkan profit dan menjual lebih banyak.

Masalah inti: pemilik warung tahu omzet, tapi tidak tahu profit per menu. Harga ditentukan "kira-kira" atau ikut warung sebelah. Menu paling ramai justru bisa jadi menu paling merugikan — dan tidak ada yang sadar.

Produk menutup dua sisi:
1. **Profit Engine** — hitung COGS asli, harga yang benar (termasuk untuk ojol), ranking menu, optimasi menu, lacak waste.
2. **Growth Engine** — ide menu baru, caption promosi, konten carousel siap posting (termasuk gambar jadi yang bisa di-download).

Full Bahasa Indonesia, konteks lokal: Rupiah, komisi platform delivery 27%, contoh "Warung Pak Budi", "Nasi Goreng Spesial", "Es Kopi Susu Gula Aren".

**Model bisnis:** lifetime access, sekali bayar Rp199.000–299.000, pembayaran via affiliate.id.

**Posisi pasar:** Blue ocean. POS lokal (Majoo, Moka, Qasir) fokus transaksi/inventory, bukan optimasi profitabilitas menu. Kalkulator HPP banyak dan gratis, tapi kombinasi kalkulator + rekomendasi aksi otomatis + generator konten marketing belum ada di level UMKM.

---

## 2. Target Pengguna `[TETAP]`

Pemilik / pengelola usaha F&B kecil-menengah di Indonesia.

- Bukan orang finance, bukan orang teknis. Tidak paham "COGS" tanpa dijelaskan.
- Punya 4–20 item menu.
- Sudah jualan di platform delivery, atau mempertimbangkan.
- **Mayoritas pegang HP di tempat usaha, jarang buka laptop.**
- Mengelola sendiri media sosial warungnya.

Konsultan/agensi F&B **bukan** segmen terpisah untuk sekarang.

**Implikasi teknis dari profil user ini (wajib dipatuhi):**
- Mobile adalah kelas satu, bukan hasil sampingan `max-width`.
- Koneksi bisa lambat → hindari bundle raksasa, hindari blocking font, tampilkan skeleton.
- Toleransi error rendah → semua pesan error dalam Bahasa Indonesia yang menenangkan, tidak pernah kode HTTP mentah.
- Tidak akan baca dokumentasi → setiap form terisi contoh nyata sejak awal.

---

## 3. Prinsip Desain `[TETAP]`

1. **Selalu ada isinya.** Setiap form terisi contoh nyata. User klik → lihat hasil → baru ganti data sendiri.
2. **Output berupa keputusan, bukan angka mentah.** Setiap hasil AI menyertakan `action`, `strategy`, alasan, rekomendasi, tips eksekusi.
3. **Selalu terjemahkan ke Rupiah.** Persentase selalu didampingi nilai rupiah.
4. **Bahasa manusia, bukan bahasa akuntan.** "Biaya Menu", bukan "COGS Analysis". "Belum berhasil", bukan "Error 500".
5. **Estetika struk & papan menu.** Hasil tampil sebagai struk (garis putus-putus, total bergaris oranye) & papan ranking berpita warna.
6. **Jujur soal tunggu.** Loading state eksplisit ("bisa 10–30 detik").
7. **Ramah saat gangguan.** Auto-retry 3× (jeda 2–4 detik) untuk 503, plus penerjemahan error teknis ke Bahasa Indonesia (503 → "server AI sedang sibuk, tunggu 1–2 menit, bukan salah Anda"; 429 → "kuota harian habis, reset sekitar jam 14.00 WIB").

---

## 4. Identitas Visual `[TETAP]`

**Warna** — biru brand induk untuk struktur & trust, oranye untuk aksen F&B & semua CTA:

| Peran | Token | Hex |
|---|---|---|
| Biru deep / biru / biru light | `--blue-deep` `--blue` `--blue-light` | `#0F4C97` `#1868C7` `#2E9BF0` |
| Oranye CTA / hover | `--orange` `--orange-hover` | `#F2790C` `#DA6900` |
| Background / surface | `--bg` `--surface` | `#F7F9FC` `#FFFFFF` |
| Teks / teks redup | `--ink` `--ink-dim` | `#132238` `#5E6C82` |
| Status hijau / kuning / merah | `--green` `--yellow` `--red` | `#188A45` `#C88A0A` `#D6432B` |

**Tipografi:** `Fraunces` (judul & angka besar), `Plus Jakarta Sans` (teks UI), `IBM Plex Mono` (angka, input, rupiah).

**Mode:** light-mode-first. Dark mode masuk backlog.

### Dua prinsip WAJIB untuk versi baru

1. **Mobile-first / fully responsive adalah prioritas inti.** "Bisa dibuka di HP" ≠ "enak dipakai di HP". Tombol besar (target sentuh ≥ 44px), tab bisa di-scroll horizontal, form jadi 1 kolom di layar kecil, tabel menu jadi kartu bertumpuk di bawah 640px, input angka memunculkan keyboard numerik (`inputMode="numeric"`).
2. **Tampilan harus lebih meyakinkan dari versi Express** — rapi, profesional, tetap di koridor light-mode + biru-oranye. Elemen tanda tangan produk tetap **struk & papan menu**: itu yang membuat produk ini terasa milik dunia warung, bukan dashboard SaaS generik.

---

## 5. Fitur — 10 Tab `[TETAP]`

Semua fitur sudah jadi & tervalidasi di versi Express. Semantik dan bentuk output **tidak boleh berubah** saat porting.

### Kelompok A — Profit Engine (Tab 1–6)

**Tab 1 · Biaya Menu (Cost Calculator).** User menempel daftar bahan sebagai teks bebas (satu bahan per baris, format bebas: `- Beras 500g @ Rp 8000/kg`). AI mengurai satuan & menghitung biaya proporsional. **Keputusan produk penting: user TIDAK dipaksa mengisi form terstruktur per bahan.**
→ *Input:* nama menu · daftar bahan (textarea) · berat/porsi · harga jual.
→ *Output:* rincian biaya per bahan (tampil sebagai struk) · total COGS/porsi · margin (%) · food waste (%).

**Tab 2 · Harga Jual (Pricing).** Nilai unik: harga delivery dihitung terpisah supaya komisi ojol tidak memakan margin — `break_even_delivery = COGS / (1 - komisi%)`.
→ *Input:* nama menu · COGS · target margin (default 65%) · harga kompetitor (opsional) · komisi platform (default 27%) · lokasi.
→ *Output:* harga dine-in · harga delivery · harga psikologis · margin di harga rekomendasi · break-even dine-in & delivery.

**Tab 3 · Ranking Profitabilitas.** Ranking berdasar **kontribusi profit mingguan**, bukan margin atau volume semata.
→ *Input:* tabel menu (nama · COGS · harga · terjual/minggu).
→ *Output:* papan ranking bernomor + status GREEN/YELLOW/RED + profit mingguan + aksi; ringkasan total profit & jumlah item untuk promote/reprice/remove.

**Tab 4 · Optimasi Menu (Menu Engineering).** `minItems` adalah guardrail agar AI tidak menyarankan menghapus seluruh menu.
→ *Input:* tabel menu lengkap + status + `minItems` (default 4) + jam sibuk.
→ *Output:* 4 kelompok — Hapus / Promosikan / Reprice / Bundling — plus estimasi dampak total.

**Tab 5 · Laporan Final (Export).**
→ *Input:* nama restoran · tanggal · tabel menu.
→ *Output:* tabel laporan 7 kolom + total item + item yang direprice + estimasi kenaikan profit bulanan. (Tombol export PDF fisik belum ada — backlog.)

**Tab 6 · Waste Tracker.** Memisahkan "paling boros %" vs "paling boros Rp" karena sering beda bahan.
→ *Input:* periode · daftar bahan (nama · jumlah beli · satuan · harga/satuan · jumlah terbuang · penyebab opsional).
→ *Output:* rincian waste per bahan (% + Rp + dugaan penyebab) · total waste (Rp) · bahan paling boros (% & Rp) · rekomendasi · estimasi penghematan bulanan.

### Kelompok B — Growth Engine (Tab 7–10)

**Tab 7 · AI Menu Ideas.** Ide dibatasi plafon COGS agar masuk akal secara modal.
→ *Input:* menu existing (nama · harga · margin) · kondisi/kekurangan · target pelanggan · batas COGS · jumlah ide (default 3).
→ *Output:* ringkasan analisa + per ide (nama · kategori · kesulitan · deskripsi · bahan · COGS · harga · margin · alasan) + tips eksekusi.

**Tab 8 · Konten Promosi (Marketing Content).**
→ *Input:* nama menu · platform (default IG) · keunggulan · gaya · info promo (opsional).
→ *Output:* caption utama · caption alternatif · hashtag · ide visual · CTA · waktu posting ideal.

**Tab 9 · Carousel Konten (teks).**
→ *Input:* sama seperti Tab 8 + jumlah slide (default 4).
→ *Output:* ringkasan konsep · per slide (nomor · tipe · teks · petunjuk foto) · caption post · hashtag.

**Tab 10 · Carousel Visual — fitur pembeda utama.** Memakai endpoint yang sama (`/api/carousel-content`). Bedanya: hasil **dirender menjadi desain slide jadi** (Gaya C: kartu putih, garis biru di atas, label oranye, rasio 4:5 / 1080×1350). Slide penutup otomatis menjadi CTA biru penuh. Tiap slide bisa **upload foto** warung sendiri (opsional; kalau dilewat → blok cream + ikon, bukan teks petunjuk). Tiap slide bisa **download PNG** (scale 5, resolusi tinggi, layak posting).

> **Ini titik produk berubah dari "alat analisa" menjadi "alat penghasil barang jadi" — user keluar membawa file gambar siap posting, tanpa Canva.** Kalau ada satu fitur yang tidak boleh turun kualitasnya saat porting, ini fiturnya.

---

## 6. Kontrak API

9 endpoint, semua `POST` kecuali health check, semua `Content-Type: application/json`.
**Path, nama field request, dan nama field response wajib identik dengan versi Express** (termasuk campuran Inggris–Indonesia). Kontrak lengkap beserta contoh payload ada di **`docs/API_CONTRACT.md`** — file itu yang menjadi acuan implementasi dan test.

| Endpoint | Tab | Ringkasan |
|---|---|---|
| `GET /api/health` | — | Health check ("Server aktif") |
| `POST /api/cost-calculator` | 1 | Urai bahan teks bebas → COGS/porsi |
| `POST /api/pricing` | 2 | Harga dine-in, delivery, psikologis, break-even |
| `POST /api/ranking` | 3 | Ranking profit mingguan + status + aksi |
| `POST /api/menu-engineering` | 4 | Hapus / promote / reprice / bundle |
| `POST /api/export` | 5 | Tabel laporan final + ringkasan |
| `POST /api/waste-tracker` | 6 | Waste per bahan + rekomendasi |
| `POST /api/menu-ideas` | 7 | Ide menu baru dengan plafon COGS |
| `POST /api/marketing-content` | 8 | Caption, hashtag, CTA, waktu posting |
| `POST /api/carousel-content` | 9 & 10 | Slide carousel (teks) — dipakai dua tab |

**Aturan yang mengikat:**

- Semua panggilan Gemini melalui satu service terpusat (`apps/ai/gemini.py`), setara `geminiHelper.js`: `call_gemini(system_instruction, user_prompt, schema)` dengan auto-retry 3× untuk 503 dan penerjemahan error ke Bahasa Indonesia.
- Model AI di-set lewat env `GEMINI_MODEL` (nilai awal disalin dari backend Express — verifikasi string persisnya sebelum deploy).
- **Structured Output wajib**: setiap endpoint punya JSON Schema sendiri. Tidak ada parsing teks bebas dari model.
- Saat gagal, response memuat field `error` berbahasa Indonesia. Frontend menampilkannya apa adanya.
- Prompt tetap dalam Bahasa Indonesia. Prompt disimpan sebagai konstanta Python per fitur, bukan disebar di dalam view.

`[BERUBAH]` **Health check** dipindah dari `GET /` ke `GET /api/health` agar konsisten di bawah prefix `/api` (root domain nantinya milik frontend). Frontend memanggil path ini untuk indikator "Server aktif".

---

## 7. Arsitektur Target

### 7.1 Gambaran layanan

```
                    ┌──────────────────────────────┐
  Browser (HP) ───► │  Nginx (prod)                │
                    └──────┬───────────────┬───────┘
                           │               │
                  ┌────────▼──────┐  ┌─────▼─────────────────┐
                  │  frontend     │  │  backend              │
                  │  Next.js 15   │─►│  Django 5 + DRF       │
                  │  React + TS   │  │  Gunicorn/Uvicorn     │
                  └───────────────┘  └──┬────────────┬───────┘
                                        │            │
                              ┌─────────▼──┐   ┌─────▼──────┐
                              │ PostgreSQL │   │ Gemini API │
                              └────────────┘   └────────────┘
                                        │
                                  ┌─────▼─────┐
                                  │   Redis   │ (cache + throttle)
                                  └───────────┘
```

**Aturan keras:** API key Gemini hanya hidup di container backend. Tidak pernah dikirim ke browser, tidak pernah masuk `NEXT_PUBLIC_*`.

### 7.2 Struktur repo

```
digify-laris/
├── docker-compose.yml            # dev: db, redis, backend, frontend
├── docker-compose.prod.yml       # prod: + nginx, tanpa hot reload
├── .env.example
├── CLAUDE.md                     # instruksi untuk Claude Code
├── PRD.md                        # dokumen ini
├── docs/
│   ├── API_CONTRACT.md           # kontrak endpoint (mengikat)
│   └── DECISIONS.md              # catatan keputusan (ADR ringan)
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── manage.py
│   ├── config/                   # settings/{base,dev,prod}.py, urls.py, asgi.py
│   └── apps/
│       ├── ai/                   # gemini.py, schemas/, errors.py, retry.py
│       ├── optimizer/            # 9 endpoint: views/, serializers/, features/, prompts/
│       ├── accounts/             # User, License, webhook affiliate.id
│       ├── usage/                # UsageLog, quota, throttling
│       └── catalog/              # (Fase 5) Menu, MenuItem tersimpan
└── frontend/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── app/                  # App Router
        │   ├── (marketing)/      # landing, harga
        │   ├── (app)/alat/…      # 10 tab
        │   └── masuk/            # login
        ├── components/
        │   ├── ui/               # Button, Field, Card, Struk, StatusPita
        │   ├── tools/            # satu folder per tab
        │   └── carousel/         # renderer slide 1080×1350 (client-only)
        ├── lib/                  # api client, format rupiah, tipe hasil AI
        └── styles/               # tokens.css
```

### 7.3 Model data

**Fase 4 (auth & billing):**

| Model | Field inti |
|---|---|
| `User` | `email` (username), `full_name`, `whatsapp`, `is_active`, `must_change_password` |
| `License` | `key` (unik), `user` (FK, nullable), `plan` (`lifetime`), `order_id` (unik, dari affiliate.id), `amount`, `status` (`pending`/`active`/`revoked`), `activated_at` |
| `WebhookEvent` | `provider`, `external_id` (unik → idempoten), `payload` (JSONB), `signature_valid`, `processed_at`, `error` |

**Fase 5 (kuota & katalog):**

| Model | Field inti |
|---|---|
| `UsageLog` | `user` (FK), `endpoint`, `status` (`ok`/`error`), `latency_ms`, `retry_count`, `created_at` |
| `DailyQuota` | `user`, `date`, `count` (denormalisasi untuk cek cepat) |
| `MenuItem` | `user`, `name`, `cogs`, `price`, `weekly_sales`, `status`, `updated_at` |

> `MenuItem` sudah dirancang sekarang meski fiturnya baru aktif di Fase 5. Alasannya: "satu daftar menu yang dipakai bersama semua tab" adalah insight prioritas #1 dari Andi, dan tabelnya murah dibuat di awal.

### 7.4 Catatan teknis kritis

1. **`html2canvas` + warna `oklch`.** Tailwind v4 menulis warna sebagai `oklch()`, dan `html2canvas` gagal mem-parse-nya. Untuk komponen slide carousel, gunakan `html2canvas-pro` **atau** kunci warna slide sebagai hex literal (bukan variabel Tailwind). Ini penyebab paling umum PNG carousel keluar hitam/kosong.
2. **Renderer carousel harus client-only**: `dynamic(() => import('...'), { ssr: false })`. Node canvas tidak ada di server.
3. **Ukuran render**: node slide harus benar-benar berukuran 1080×1350 saat di-capture (boleh dikecilkan visual dengan `transform: scale()`, tapi elemen sumbernya berukuran penuh), lalu `scale: 5` untuk output tajam.
4. **Font di canvas**: font harus sudah ter-load sebelum capture (`await document.fonts.ready`), kalau tidak PNG keluar dengan font fallback.
5. **Timeout**: panggilan Gemini bisa 10–30 detik. Set timeout Gunicorn/Nginx ≥ 120 detik, dan timeout fetch frontend ≥ 90 detik. Default Nginx 60 detik akan memotong request yang sebenarnya berhasil.
6. **CORS**: dev pakai `http://localhost:3000` → `http://localhost:8000`, atur `django-cors-headers`. Prod satu domain lewat Nginx (`/api` → backend), CORS jadi tidak relevan.

---

## 8. Auth, Billing & Anti-Boncos

### 8.1 Alur pembayaran (affiliate.id)

```
Konsumen bayar di affiliate.id
        │
        ▼
POST /api/webhooks/affiliate-id   (backend Django)
        │  ① verifikasi signature/secret
        │  ② simpan WebhookEvent (idempoten by external_id)
        │  ③ buat User + License (status active)
        │  ④ generate password acak, must_change_password = true
        ▼
Kirim kredensial ke pembeli (email/WhatsApp)
        │
        ▼
User login di /masuk → dipaksa ganti password → masuk aplikasi
```

**Wajib:** webhook idempoten (satu `order_id` diproses sekali), selalu balas `200` untuk event yang sudah pernah diproses, dan **tidak pernah** memproses ulang pembuatan akun.

### 8.2 Otentikasi

- DRF SimpleJWT. Access token pendek (15 menit), refresh token panjang (30 hari), keduanya disimpan sebagai **cookie httpOnly** — bukan localStorage.
- Route Handler tipis di Next.js (`/api/auth/*`) yang meneruskan ke Django dan menetapkan cookie. Ini satu-satunya tempat frontend punya "backend".
- Tidak ada self-signup publik. Akun hanya lahir dari webhook (plus perintah `manage.py` untuk membuat akun manual/tester).

### 8.3 Kuota ("anti-boncos") — kritikal untuk model lifetime

Lifetime access + API AI berbayar = risiko biaya tak terbatas. Wajib ada sebelum jual publik.

- Setiap panggilan endpoint AI mencatat `UsageLog` dan menaikkan `DailyQuota`.
- Batas default: **50 panggilan AI / user / hari** (angka awal, dikonfigurasi lewat env, ditinjau setelah 2 minggu data nyata).
- Saat batas tercapai → HTTP 429 dengan pesan Bahasa Indonesia: "Kuota harian Anda sudah habis. Reset otomatis besok pagi." Bukan pesan teknis.
- Throttle burst tambahan (mis. 10 request/menit) lewat DRF `ScopedRateThrottle` beralas Redis, untuk menahan klik ganda dan skrip.
- Dashboard admin Django menampilkan pemakaian per user agar Owner bisa melihat siapa yang tidak wajar.

---

## 9. Rencana Build Bertahap

Tiap fase punya kriteria selesai yang bisa dites. **Jangan mulai fase berikutnya sebelum fase sebelumnya lulus.**

### Fase 0 — Fondasi
Scaffold repo, `docker-compose.yml` (db, redis, backend, frontend), Django + DRF berjalan, Next.js berjalan, `.env.example`, health check hidup.
**Selesai jika:** `docker compose up` sekali jalan → `http://localhost:3000` tampil dan berhasil memanggil `GET /api/health`.

### Fase 1 — Porting 9 endpoint AI
Service Gemini terpusat (retry + terjemahan error), schema per endpoint, serializer validasi input, 9 view.
**Selesai jika:** semua endpoint mengembalikan JSON dengan **nama field persis** seperti `docs/API_CONTRACT.md`; test kontrak lulus dengan respons Gemini yang di-mock; error 503 memicu retry dan berujung pesan Bahasa Indonesia.

### Fase 2 — Kerangka frontend + Tab 1–6 (Profit Engine)
Design token, komponen dasar (Struk, PapanRanking, StatusPita, Field, Button), navigasi tab yang bisa di-scroll, prefill contoh di semua form, loading state jujur, error state ramah.
**Selesai jika:** Tab 1–6 jalan end-to-end di layar 360px tanpa scroll horizontal, dan hasilnya sama dengan versi Express untuk input contoh yang sama.

### Fase 3 — Tab 7–10 (Growth Engine) + Carousel Visual
Termasuk upload foto per slide, renderer 1080×1350, download PNG scale 5.
**Selesai jika:** PNG hasil download benar-benar 1080×1350, warna & font sesuai desain, foto upload tampil, slide tanpa foto menampilkan blok cream + ikon.

### Fase 4 — Auth + Billing
Model User/License/WebhookEvent, endpoint webhook affiliate.id, login, paksa ganti password, proteksi seluruh endpoint AI.
**Selesai jika:** webhook palsu (fixture) menghasilkan satu akun aktif; webhook yang sama dikirim 3× tetap menghasilkan satu akun; endpoint AI menolak request tanpa token.

### Fase 5 — Anti-boncos + Katalog Menu
UsageLog, DailyQuota, throttle, admin view pemakaian. Lalu `MenuItem` tersimpan + "satu daftar menu untuk semua tab" (insight prioritas #1 Andi).
**Selesai jika:** user melewati batas mendapat 429 berbahasa Indonesia; daftar menu yang diisi di Tab 3 langsung tersedia di Tab 4, 5, dan 7 tanpa diketik ulang.

### Fase 6 — Produksi
`docker-compose.prod.yml`, Nginx, static/media, backup Postgres terjadwal, logging, Sentry (opsional), checklist keamanan.
**Selesai jika:** deploy dari nol di VPS bersih hanya butuh `.env` + `docker compose -f docker-compose.prod.yml up -d`, dan restore backup teruji sekali.

---

## 10. Kebutuhan Non-Fungsional

| Aspek | Target |
|---|---|
| Waktu respons endpoint AI | 10–30 detik wajar; timeout 120 detik; user selalu melihat status tunggu |
| Waktu muat halaman (4G, HP menengah) | LCP < 2,5 detik |
| Responsif | 360px sampai desktop; target sentuh ≥ 44px |
| Aksesibilitas | Kontras teks memenuhi WCAG AA, fokus keyboard terlihat, `prefers-reduced-motion` dihormati |
| Bahasa | **Seluruh teks yang dilihat user berbahasa Indonesia.** Tidak ada string Inggris yang bocor ke layar |
| Keamanan | API key hanya di backend; cookie httpOnly; webhook diverifikasi signature; rate limit aktif |
| Data | Backup Postgres harian; restore diuji minimal sekali sebelum jual publik |
| Observability | Log terstruktur per panggilan AI (endpoint, durasi, retry, status) |

---

## 11. Backlog (setelah v1)

Dari insight Andi (v1.0 Bagian 9) dan backlog Owner:

1. **Preset komisi per platform delivery** — GoFood/GrabFood/ShopeeFood punya struktur komisi berbeda; saat ini hardcode 27%. Dropdown preset = akurasi Tab 2 naik.
2. **Export laporan ke PDF** — Tab 5 sudah menjanjikan "siap cetak", tombolnya belum ada.
3. **Perbandingan antar periode untuk Waste Tracker** — sekarang bisa, karena data tersimpan.
4. **Download semua slide carousel sekaligus** (ZIP), sekarang satu per satu.
5. **Dark mode.**
6. **Refactor penamaan field EN–ID** menjadi konsisten (sengaja ditunda dari v1).
7. **Dashboard / Control Tower** — agregasi profit, waste, dan menu bermasalah dalam satu layar.

---

## 12. Risiko & Keputusan yang Masih Terbuka

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Biaya Gemini membengkak karena lifetime access | Tinggi | Fase 5 wajib sebelum jual publik; kuota harian; monitoring biaya mingguan |
| String model AI (`GEMINI_MODEL`) berbeda dari yang tercatat di PRD v1.0 | Sedang | Verifikasi langsung dari `.env` backend Express sebelum Fase 1 selesai |
| Hasil AI berubah karakter setelah porting (prompt tersalin tidak persis) | Sedang | Salin prompt **verbatim** dari `routes/*.js`; bandingkan output lama vs baru untuk input contoh yang sama |
| PNG carousel turun kualitas di stack baru | Tinggi (ini fitur pembeda) | Fase 3 punya kriteria selesai eksplisit; uji manual di Chrome Android & Safari iOS |
| Nginx/Gunicorn memotong request AI yang lambat | Sedang | Timeout ≥ 120 detik disetel sejak Fase 0 |
| Owner non-IT terkunci pada satu developer | Sedang | TypeScript + type hints + `docs/DECISIONS.md` + README yang bisa dijalankan orang baru |

**Masih perlu keputusan:**
- Angka kuota harian awal (usulan: 50/hari) — konfirmasi Owner.
- Kanal pengiriman kredensial setelah pembayaran: email, WhatsApp, atau keduanya.
- Domain & penyedia VPS untuk produksi.

---

*Dokumen ini melengkapi, bukan menggantikan, PRD v1.0 dari sisi produk. Jika ada konflik soal perilaku produk, v1.0 menang. Jika ada konflik soal arsitektur, v2.0 menang.*
