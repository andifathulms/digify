# CLAUDE.md

Project instructions for Claude Code. Read this before touching any file.

---

## 1. What this is

**Digify Laris — Menu Optimizer.** An AI tool for small Indonesian F&B businesses (warung, kedai, kafe) that calculates real per-menu profit and generates ready-to-post marketing content.

The users are warung owners on phones. Not technical, not finance people, often on slow connections. Every decision below follows from that.

A working Express + single-HTML version already exists and is validated. **This project is a port, not a greenfield build.** Behaviour must match; only the stack changes.

Read `PRD.md` for product truth and `docs/API_CONTRACT.md` for the endpoint contract. When they conflict with your instinct, they win.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Backend | Django 5 + Django REST Framework, Python 3.12 |
| Frontend | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS + CSS variables for brand tokens |
| Database | PostgreSQL 16 |
| Cache / throttle | Redis |
| AI | Google Gemini (`google-genai` Python SDK), structured output |
| Auth | DRF SimpleJWT, httpOnly cookies |
| Infra | Docker Compose (dev + prod) |

---

## 3. Non-negotiables

Break any of these and the work gets reverted:

1. **The Gemini API key never leaves the backend container.** Never in `NEXT_PUBLIC_*`, never in a client component, never in a browser network call.
2. **API paths and JSON field names are frozen.** They intentionally mix English and Indonesian (`cogs_per_portion` alongside `ringkasan_periode`). Do not "clean this up" — the owner decided to keep it for v1. Match `docs/API_CONTRACT.md` exactly.
3. **Every string the user sees is Bahasa Indonesia.** No English leaking into labels, buttons, empty states, or errors. No raw HTTP codes.
4. **Mobile is the primary target.** Design at 360px first, then widen. No horizontal scroll. Touch targets ≥ 44px.
5. **All AI calls go through the one service** in `backend/apps/ai/gemini.py`. No view calls Gemini directly.
6. **Prompts are copied verbatim** from the existing Express `routes/*.js`. Do not rewrite, "improve", or translate them. Different prompt = different output = regression.
7. **No new dependency without a reason written in `docs/DECISIONS.md`.**

---

## 4. Repo layout

```
digify-laris/
├── docker-compose.yml          # dev
├── docker-compose.prod.yml     # prod
├── CLAUDE.md  PRD.md
├── docs/API_CONTRACT.md  docs/DECISIONS.md
├── backend/
│   ├── config/settings/{base,dev,prod}.py
│   └── apps/
│       ├── ai/          # gemini.py, errors.py, schemas/
│       ├── optimizer/   # 9 endpoints: views/, serializers/, prompts/
│       ├── accounts/    # User, License, affiliate.id webhook
│       ├── usage/       # UsageLog, DailyQuota, throttling
│       └── catalog/     # (phase 5) saved MenuItem
└── frontend/src/
    ├── app/(marketing)/ · app/(app)/alat/ · app/masuk/
    ├── components/ui/ · components/tools/ · components/carousel/
    └── lib/ · styles/tokens.css
```

**One module per feature.** `optimizer/prompts/pricing.py`, `optimizer/serializers/pricing.py`, `optimizer/views/pricing.py`. Never one giant `views.py`.

---

## 5. Commands

```bash
# Everything
docker compose up --build
docker compose down -v            # nuke volumes when migrations get tangled

# Backend (run inside the container)
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend pytest
docker compose exec backend ruff check . && ruff format .

# Frontend
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck
docker compose exec frontend npm run build
```

Never run `pip install` or `npm install` on the host. Add to `pyproject.toml` / `package.json`, then rebuild.

---

## 6. Backend conventions

- **Views:** thin `APIView` subclasses. Validate with a serializer, call the feature function, return `Response`. No business logic in views.
- **The AI service** (`apps/ai/gemini.py`) exposes one entry point:
  ```python
  def call_gemini(system_instruction: str, user_prompt: str, schema: dict) -> dict
  ```
  It handles: structured output enforcement, auto-retry 3× with 2–4s backoff on 503, and translating technical failures into friendly Indonesian.
- **Error envelope** — always this shape, always Indonesian:
  ```json
  { "error": "Server AI sedang sibuk. Coba lagi 1–2 menit lagi, ini bukan salah Anda." }
  ```
  Mapping: `503` → busy-server message; `429` → daily quota message (reset ~14.00 WIB); timeout → "Prosesnya terlalu lama, coba lagi"; anything else → generic "Belum berhasil" message. Log the real exception; never show it.
- **Model name** comes from `GEMINI_MODEL` env var. Never hardcode it.
- **Structured output only.** Every endpoint has an explicit JSON schema in `apps/ai/schemas/`. No free-text parsing, no regex over model output.
- **Type hints on every function.** `mypy`-friendly, even if mypy isn't enforced yet.
- **Money is `Decimal`**, never `float`. Rupiah has no cents in this product — round to whole rupiah at the boundary.
- **Migrations are committed.** One migration per logical change, descriptive name.

### Testing

- Contract tests for all 9 endpoints with the Gemini call mocked: assert the exact response field names from `docs/API_CONTRACT.md`.
- Unit tests for pure math: `break_even_delivery = cogs / (1 - platform_fee)`, margin, weekly profit.
- Retry logic test: 503 twice then success → one successful response, `retry_count == 2`.
- Webhook tests: valid signature creates one account; the same `order_id` delivered 3× still creates one account.

---

## 7. Frontend conventions

- **Server Components by default.** Add `"use client"` only for forms, interactivity, and the carousel renderer.
- **All backend calls go through `src/lib/api.ts`.** One place for base URL, credentials, timeout (90s), and error normalization. No bare `fetch` in components.
- **Types mirror the API contract** in `src/lib/types/`. Keep the mixed EN/ID field names — the type layer is where that awkwardness is documented, not fixed.
- **No form libraries needed** for v1. Controlled inputs and local state are enough; don't add react-hook-form + zod + a state manager to a 10-form app.
- **Every form ships with realistic prefilled example data** ("Warung Pak Budi", "Nasi Goreng Spesial", "Es Kopi Susu Gula Aren"). This is a product rule, not a nicety: the user clicks and sees a result before they type anything.
- **Number inputs:** `inputMode="numeric"`, and display values formatted as Rupiah (`Rp 12.500`) via a single `formatRupiah` helper.
- **Tables become stacked cards below 640px.** Never a horizontally scrolling data table on mobile.

### Loading and error states

- Loading copy is honest and specific: "Sedang menghitung… bisa 10–30 detik." A bare spinner is not acceptable.
- Errors render the `error` string from the backend as-is. The frontend does not invent its own error text.
- Empty states tell the user what to do next, in one sentence.

---

## 8. Design system

Brand tokens live in `src/styles/tokens.css` as CSS variables. Never hardcode a brand colour in a component.

```css
--blue-deep:#0F4C97;  --blue:#1868C7;  --blue-light:#2E9BF0;
--orange:#F2790C;     --orange-hover:#DA6900;
--bg:#F7F9FC;         --surface:#FFFFFF;
--ink:#132238;        --ink-dim:#5E6C82;
--green:#188A45;      --yellow:#C88A0A;  --red:#D6432B;
```

**Typography:** `Fraunces` for headings and big numbers, `Plus Jakarta Sans` for UI text, `IBM Plex Mono` for numbers, inputs, and rupiah values. Load via `next/font` with `display: swap`.

**Signature elements — keep these, they are the product's identity:**
- **Struk (receipt):** analysis results render as a receipt — dotted separators, mono figures right-aligned, total on an orange rule.
- **Papan ranking (menu board):** ranked items with numbered positions and coloured status ribbons (GREEN / YELLOW / RED).

Light mode only. Dark mode is backlog — don't build it speculatively.

Orange is CTA-only. If everything is orange, nothing is.

### Copy rules

Human language, never accountant language: "Biaya Menu" not "COGS Analysis", "Belum berhasil" not "Error 500", "Simpan perubahan" not "Submit". Every percentage is shown next to its rupiah value. Buttons keep the same verb through the whole flow.

---

## 9. Known traps

1. **`html2canvas` cannot parse `oklch()` colours** (Tailwind v4's default output). The carousel PNG will come out black or blank. Use `html2canvas-pro`, or hardcode hex literals inside the slide component. This is the single most likely thing to break.
2. **Carousel renderer must be client-only:** `dynamic(() => import('./SlideRenderer'), { ssr: false })`.
3. **Render at true size.** The captured node must actually be 1080×1350 px (visually scale it down with `transform: scale()` if needed), then capture at `scale: 5`.
4. **Wait for fonts:** `await document.fonts.ready` before capture, or the PNG gets fallback fonts.
5. **Timeouts.** Gemini calls take 10–30s. Gunicorn/Nginx timeout ≥ 120s, frontend fetch timeout 90s. Nginx's 60s default will kill successful requests.
6. **Docker hot reload** needs the source bind-mounted and, on some systems, `WATCHPACK_POLLING=true` for Next.js.
7. **CORS in dev only** (`localhost:3000` → `localhost:8000`). In prod, Nginx proxies `/api` on the same origin, so don't ship permissive CORS to production.
8. **Tab 9 and Tab 10 share `/api/carousel-content`.** Tab 10 differs only in rendering. Do not duplicate the endpoint.

---

## 10. How to work

- **Follow the phases in `PRD.md` §9.** Don't start a phase before the previous one meets its acceptance criteria.
- **Small commits, one concern each.** Conventional-commit style: `feat(optimizer): port pricing endpoint`.
- **Before writing a new endpoint,** open the corresponding Express route and copy the prompt and schema across. Reference beats reinvention here.
- **After each phase,** verify manually at 360px width, not just on desktop.
- **When a decision has more than one reasonable answer,** write it in `docs/DECISIONS.md` (date, decision, why, what was rejected). The owner is non-technical and will depend on this record.
- **Ask before:** changing an API field name, adding a paid third-party service, changing the auth model, or altering how the carousel renders.

## What not to do

- Don't refactor the mixed EN/ID field names.
- Don't rewrite the Indonesian prompts.
- Don't add dark mode, PDF export, delivery-platform presets, or the shared menu state before phase 5 — they're scoped as backlog.
- Don't introduce a state management library, a component library, or a monorepo tool.
- Don't put business logic in React components or in DRF views.
- Don't skip the quota work (phase 5) before public launch. Lifetime pricing plus an unmetered AI API is an open-ended bill.
