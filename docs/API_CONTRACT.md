# API Contract — Digify Laris Menu Optimizer

**Status: binding.** These paths and field names come from the validated Express backend. Port them exactly. The English/Indonesian mix is intentional and frozen for v1 (owner decision — see `PRD.md` §0).

**Conventions**
- All endpoints are `POST` with `Content-Type: application/json` except the health check.
- Base path: `/api`
- Success → `200` with the response object described below.
- Failure → non-2xx with `{ "error": "<pesan Bahasa Indonesia>" }` and nothing else.
- Money values are whole rupiah (integers). Percentages are numbers, not strings with `%`.
- Every endpoint enforces a Gemini structured-output JSON schema; the response shape is guaranteed by the schema, not by parsing.

---

## `GET /api/health`

Health indicator for the frontend's "Server aktif" badge.

**Response `200`**
```json
{ "status": "ok", "service": "digify-laris-api" }
```

---

## 1. `POST /api/cost-calculator` — Tab 1 · Biaya Menu

Parses a free-text ingredient list. The user is never forced into a structured per-ingredient form.

**Request**

| Field | Type | Notes |
|---|---|---|
| `itemName` | string | required |
| `ingredientsList` | string | required, multiline, free format (`- Beras 500g @ Rp 8000/kg`) |
| `portionWeight` | number | grams per portion |
| `currentPrice` | number | current selling price, rupiah |

**Response**

| Field | Type |
|---|---|
| `item_name` | string |
| `ingredients_breakdown` | array of `{ nama, jumlah, satuan, harga_satuan, biaya }` |
| `cogs_per_portion` | number |
| `current_margin_percentage` | number |
| `food_waste_percentage` | number |

---

## 2. `POST /api/pricing` — Tab 2 · Harga Jual

Delivery price is computed separately so platform commission doesn't eat the margin.

`break_even_delivery = cogs / (1 - platformFeePercent/100)`

**Request**

| Field | Type | Notes |
|---|---|---|
| `itemName` | string | required |
| `cogs` | number | required |
| `targetMargin` | number | default `65` |
| `competitorPrice` | number | optional |
| `platformFeePercent` | number | default `27` |
| `location` | string | e.g. "Semarang" |

**Response**

| Field | Type |
|---|---|
| `item_name` | string |
| `dine_in_recommended` | number |
| `delivery_recommended` | number |
| `psychological_price` | number |
| `margin_at_recommended` | number |
| `break_even_dine_in` | number |
| `break_even_delivery` | number |

---

## 3. `POST /api/ranking` — Tab 3 · Ranking Profitabilitas

Ranks by **weekly profit contribution**, not by margin or volume alone.

**Request**

| Field | Type |
|---|---|
| `menuItems[]` | `{ name, cogs, price, weeklySales }` |

**Response**

| Field | Type |
|---|---|
| `rankings[]` | `{ rank, item, weekly_profit, margin_percentage, status, action }` — `status` ∈ `GREEN` \| `YELLOW` \| `RED` |
| `total_weekly_profit` | number |
| `items_to_promote` | number |
| `items_to_reprice` | number |
| `items_to_remove` | number |

---

## 4. `POST /api/menu-engineering` — Tab 4 · Optimasi Menu

`minItems` is a guardrail so the model never recommends deleting the whole menu.

**Request**

| Field | Type | Notes |
|---|---|---|
| `menuItems[]` | `{ name, cogs, price, margin, weeklySales, status }` | |
| `minItems` | number | default `4` |
| `peakHours` | string | e.g. "11.00–13.00" |

**Response**

| Field | Type |
|---|---|
| `remove[]` | array of recommendations |
| `promote[]` | array of recommendations |
| `reprice[]` | array of recommendations |
| `bundle[]` | array of recommendations |
| `total_estimated_impact` | number |

Each recommendation object carries the item plus its reason and suggested action — copy the exact schema from the Express route.

---

## 5. `POST /api/export` — Tab 5 · Laporan Final

**Request**

| Field | Type |
|---|---|
| `restaurantName` | string |
| `date` | string |
| `menuItems[]` | `{ name, cogs, oldPrice, newPrice, margin, weeklySales }` |

**Response**

| Field | Type |
|---|---|
| `nama_restoran` | string |
| `tanggal` | string |
| `menu_items[]` | 7-column report rows |
| `ringkasan` | object — total items, repriced items, estimated monthly profit increase |

> Note the language flip: request keys are English, response keys are Indonesian. This is expected. Do not normalise it.

---

## 6. `POST /api/waste-tracker` — Tab 6 · Waste Tracker

Separates "most wasteful by %" from "most wasteful by Rp" — they're often different ingredients.

**Request**

| Field | Type |
|---|---|
| `periode` | string |
| `bahanList[]` | `{ nama, jumlahBeli, satuan, hargaSatuan, jumlahTerbuang, penyebab? }` |

**Response**

| Field | Type |
|---|---|
| `ringkasan_periode` | string |
| `waste_breakdown[]` | per-ingredient: percentage, rupiah, suspected cause |
| `total_nilai_waste_rupiah` | number |
| `bahan_paling_boros_persen` | string |
| `bahan_paling_boros_rupiah` | string |
| `rekomendasi[]` | array of strings |
| `estimasi_penghematan_bulanan` | number |

---

## 7. `POST /api/menu-ideas` — Tab 7 · AI Menu Ideas

Ideas are capped by a COGS ceiling so they stay affordable to actually cook.

**Request**

| Field | Type | Notes |
|---|---|---|
| `existingMenu[]` | `{ name, price, margin }` | |
| `kondisi` | string | current problems / gaps |
| `targetPelanggan` | string | |
| `maxCogs` | number | ceiling |
| `jumlahIde` | number | default `3` |

**Response**

| Field | Type |
|---|---|
| `ringkasan_analisa` | string |
| `ide_menu[]` | `{ nama, kategori, kesulitan, deskripsi, bahan, cogs, harga, margin, alasan }` |
| `tips_eksekusi[]` | array of strings |

---

## 8. `POST /api/marketing-content` — Tab 8 · Konten Promosi

**Request**

| Field | Type | Notes |
|---|---|---|
| `namaMenu` | string | |
| `keunggulan` | string | |
| `platform` | string | default `Instagram` |
| `gaya` | string | tone |
| `infoPromo` | string | optional |

**Response**

| Field | Type |
|---|---|
| `caption_utama` | string |
| `caption_alternatif[]` | array of strings |
| `hashtag_rekomendasi[]` | array of strings |
| `ide_visual` | string |
| `call_to_action` | string |
| `waktu_posting_ideal` | string |

---

## 9. `POST /api/carousel-content` — Tab 9 & Tab 10

**One endpoint, two tabs.** Tab 9 shows the text; Tab 10 renders the same payload into finished 1080×1350 slide images. Do not duplicate this endpoint.

**Request**

| Field | Type | Notes |
|---|---|---|
| `namaMenu` | string | |
| `keunggulan` | string | |
| `platform` | string | |
| `gaya` | string | |
| `infoPromo` | string | optional |
| `jumlahSlide` | number | default `4` |

**Response**

| Field | Type |
|---|---|
| `ringkasan_konsep` | string |
| `slides[]` | `{ nomor_slide, tipe_slide, teks_slide, petunjuk_foto }` |
| `caption_post` | string |
| `hashtag_rekomendasi[]` | array of strings |

**Tab 10 rendering rules (client-side, not API):**
- Card style "Gaya C": white card, blue rule across the top, orange label, 4:5 ratio (1080×1350).
- The final slide automatically becomes a full-blue CTA slide.
- Each slide accepts an optional user photo upload. If skipped, show a cream block with an icon — **not** the `petunjuk_foto` text.
- Each slide downloads as PNG at `scale: 5`.

---

## Error responses

Single shape, always Indonesian, never a raw exception or status code:

```json
{ "error": "Server AI sedang sibuk. Coba lagi 1–2 menit lagi, ini bukan salah Anda." }
```

| Cause | HTTP | Message intent |
|---|---|---|
| Gemini 503 after 3 retries | 503 | AI server busy, wait 1–2 minutes, not the user's fault |
| Gemini 429 / quota | 429 | Daily quota used up, resets around 14.00 WIB |
| User daily quota exceeded (phase 5) | 429 | Your daily quota is used up, resets tomorrow morning |
| Invalid input | 400 | Say which field needs fixing, in plain language |
| Timeout | 504 | Took too long, please try again |
| Anything else | 500 | Generic "Belum berhasil" message |

Retry policy: 3 attempts, 2–4 second backoff, applied to 503 only. Retries happen inside `apps/ai/gemini.py`; endpoints never implement their own.
