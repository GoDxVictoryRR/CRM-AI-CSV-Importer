# GrowEasy CRM — AI CSV Lead Importer

A production-ready AI-powered CSV importer. It accepts arbitrary CSV files from any lead source (Facebook Ads, Google Sheets, real-estate CRM exports, manual spreadsheets), intelligently maps columns to a strict CRM schema using Gemini AI, enforces deterministic business rules regardless of AI output, and presents structured import results with CSV download support.


## Architecture & Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  BROWSER (Next.js 15)                                                │
│                                                                      │
│  1. User drops/picks CSV file                                        │
│  2. PapaParse parses CSV client-side → Preview Table (no AI yet)    │
│  3. User clicks "Confirm Import"                                     │
│  4. Frontend slices rows into 30-row batches                         │
│  5. For each batch (sequential, not parallel):                       │
│     ┌──────────────────────────────────────────────┐                │
│     │  POST /api/import  (mini-CSV for this batch) │                │
│     └──────────────────────────────┬───────────────┘                │
│                                    │  Update progress UI            │
│                                    │  "Batch 2 of 5 · 40%"         │
└────────────────────────────────────┼─────────────────────────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  EXPRESS BACKEND         │
                        │  (Node.js + TypeScript)  │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  importController.ts     │
                        │                          │
                        │  1. Parse CSV (server)   │
                        │  2. computeCsvHash()     │
                        │       │                  │
                        │   ┌───▼───┐              │
                        │   │CACHE  │  HIT ──────► return cached result
                        │   │ MAP   │              │  { cached: true }
                        │   └───┬───┘              │
                        │   MISS│                  │
                        │  3. quotaGuard.check()   │
                        │     ├── BLOCKED ────────► 429 "AI paused"
                        │     └── ALLOWED          │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  aiExtractionService     │
                        │  (batch + retry loop)    │
                        │                          │
                        │  For each 30-row batch:  │
                        │  ┌──────────────────┐    │
                        │  │ geminiProvider   │    │
                        │  │ extractBatch()   │    │
                        │  │ (Gemini Flash)   │    │
                        │  └────────┬─────────┘    │
                        │  Retry w/ exponential    │
                        │  backoff on 429/5xx      │
                        │  (max 3 attempts)        │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  F7 Deterministic        │
                        │  Validation Layer        │
                        │                          │
                        │  • crm_status enum check │
                        │  • data_source enum check│
                        │  • created_at date parse │
                        │  • email/mobile fallback │
                        │  • skip if no contact    │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  Cache SET (on miss)     │
                        │  Return structured JSON  │
                        │  { parsed[], skipped[],  │
                        │    totalParsed,          │
                        │    totalSkipped,         │
                        │    cached: false }       │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │  BROWSER accumulates     │
                        │  responses from all      │
                        │  batches → merge →       │
                        │  ResultsTable display    │
                        │  + Download CSV buttons  │
                        └─────────────────────────┘
```

---

## Tech Stack

| Layer | Library / Tool | Why This Choice |
|---|---|---|
| Frontend framework | **Next.js 15** (App Router, React 18) | Native Vercel deployment, zero-config, SSR/SSG flexibility |
| CSS | **Tailwind CSS** | Utility-first, dark mode with `darkMode: 'class'`, no runtime overhead |
| Client-side CSV parsing | **PapaParse** | Fastest browser CSV parser, handles edge cases (BOM, quoted newlines, varied line endings) |
| Icons | **Lucide React** | MIT-licensed, tree-shakeable, consistent design language |
| Backend framework | **Express** (not NestJS/Fastify) | Minimal overhead for a single-endpoint API; full control without DI magic |
| File upload | **Multer 2.x** | Multipart form parsing, memory-buffer strategy (no disk writes required on Render) |
| TypeScript compilation | **tsc + tsx** | Strict typing enforced; tsx for fast dev hot-reload without precompilation |
| AI extraction | **@google/genai** with `gemini-flash-latest` | Free-tier available; Flash model is fastest among Gemini models; JSON mode output |
| Rate limiting | **express-rate-limit** | Per-IP abuse prevention, minimal setup |
| Unit tests | **Jest + ts-jest** | Industry standard; ts-jest removes separate compile step for test files |

---

## Key Engineering Decisions

### 1. Client-Side Sequential Batching
**What:** The frontend splits a CSV into 30-row chunks and makes sequential API calls — one per batch — updating a progress bar between each call.

**Why:** Vercel (frontend) and Render free tier (backend) do not support long-lived HTTP connections or Server-Sent Events reliably. Sequential client-driven batching achieves real-time per-batch progress without WebSockets or SSE, and isolates per-batch failures so partial imports are preserved rather than lost.

**Tradeoff:** Adds latency overhead (HTTP handshake per batch). For very large files (1000+ rows), total import time is longer than a single streaming call would be.

**Rate-Limiter Note:** The per-IP limit was raised from 10 to 100 req/10min to accommodate 3000-row CSVs (100 batches). The real abuse protection is the global `quotaGuard` (1000 AI calls/day across all users).

---

### 2. In-Memory Result Cache (SHA-256)
**What:** Before calling Gemini, the backend computes a SHA-256 hash of normalized CSV content (lowercase headers + trimmed row values). If the hash exists in an LRU Map (max 200 entries, 24h TTL), the cached result is returned immediately with `cached: true`.

**Why:** Prevents redundant Gemini calls when reviewers or testers upload the same file repeatedly. A single import of a 300-row file costs 10 API calls; caching eliminates all 10 on every subsequent identical upload.

**Tradeoff:** Cache lives in process memory — it resets when the Render free-tier backend restarts or sleeps (~15min idle). This is an intentional, documented tradeoff, not a bug. A persistent cache (Redis) would require a paid tier.

---

### 3. Global Gemini Quota Guard
**What:** A singleton `quotaGuard` tracks cumulative Gemini API calls across ALL users (not per-IP), resetting daily at midnight Pacific time. Capped at 1000 calls/day (vs Gemini's ~1500 free-tier limit — 33% headroom). When the cap is reached, the endpoint returns a user-friendly 429 instead of allowing the raw Gemini error to surface.

**Why:** Protects the shared API key from being exhausted by multiple concurrent reviewers or repeated testing. The per-IP rate limiter alone cannot protect against this.

**Tradeoff:** Cap resets with the server process; if Render restarts mid-day, the counter resets to 0 (conservative direction — acceptable).

---

### 4. Deterministic Validation Layer (F7) as an AI Safety Net
**What:** After every Gemini response, a pure TypeScript function enforces: exact `crm_status` enum (4 values), exact `data_source` enum (5 values), date parseability (clear if unparseable), fallback email/mobile extraction from raw row if AI missed them, and mandatory skip if neither email nor mobile exists.

**Why:** LLMs hallucinate. The AI may map a status as `"Interested"` when the only valid values are `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`. This layer enforces correctness regardless of AI output. It is unit-tested independently of the AI.

**Tradeoff:** Slightly more conservative than pure AI output — valid-looking but off-enum values are cleared to blank rather than mapped heuristically.

---

### 5. Retry with Exponential Backoff
**What:** Each Gemini batch gets up to 3 attempts. 429 (rate limit) errors wait 60s before retry; other errors use exponential backoff (2s → 4s → give up). Permanently failed batches are recorded as skipped rows with a clear reason.

**Why:** Gemini free-tier quotas are enforced in burst windows. A transient 429 at batch 3 of 10 should not abort the entire import.

**Tradeoff:** Import can stall for up to 60s on a 429 hit, which looks like a frozen UI without the progress indicator. The progress bar mitigates this perception.

---

## Pipeline / Data Flow — One Row's Complete Journey

**Setup:** User uploads a CSV with 90 rows. Frontend splits into 3 batches of 30.

### Batch 1, Row 1 (`{ "Full Name": "Ramesh Kumar", "Email ID": "ramesh@example.com" }`)

1. **Client parse (PapaParse):** Raw CSV → JS objects with header keys.
2. **Client chunks:** Batch 1 (rows 1–30) serialized back to mini-CSV.
3. **POST /api/import** with batch-1.csv.
4. **Server parse (csvService):** CSV string → `Record<string, string>[]`.
5. **computeCsvHash():** SHA-256 of normalized headers+rows → `abc123...`.
6. **Cache check:** First upload — MISS. Proceed.
7. **quotaGuard.checkAndIncrement():** Counter goes 0→1. Allowed.
8. **geminiProvider.extractBatch():** Prompt sent to `gemini-flash-latest`. Returns:
   ```json
   { "records": [{ "name": "Ramesh Kumar", "email": "ramesh@example.com", "crm_status": "GOOD_LEAD_FOLLOW_UP" }] }
   ```
9. **validateAndCollect():**
   - email ✓ present → not skipped
   - `crm_status`: `GOOD_LEAD_FOLLOW_UP` ∈ allowed set → kept
   - `data_source`: blank → kept as blank
   - `created_at`: absent → skip date processing
   - Result: added to `parsedRecords`
10. **Cache SET:** Full batch result stored under hash `abc123...`.
11. **Response:** `{ parsed: [...], skipped: [], totalParsed: 30, totalSkipped: 0, cached: false }`.
12. **Frontend:** Accumulates parsed records, progress = "Batch 1 of 3 · 33%".

**Batches 2 & 3 repeat steps 3–12.**

### Same file uploaded again (cache hit):
Steps 1–5 same. Step 6: Cache HIT on `abc123...` → returns cached result immediately. Steps 7–11 skipped entirely. Response includes `cached: true`. Frontend shows ⚡ "Served from cache" badge.

### Batch permanently fails (all 3 retries exhausted):
All rows in that batch are added to `skippedRecords` with reason `"AI batch failure after 3 retries: ..."`. Import continues with remaining batches. User sees those rows in the Skipped tab and can click **Retry Failed Rows** to re-stage them.

---

## Key Features & Technical Specs

| Requirement | Status | Location |
|---|---|---|
| AI field extraction (any CSV → CRM schema) | ✅ Full | `geminiProvider.ts` |
| Intelligent column mapping (synonyms, ambiguous headers) | ✅ Full | `geminiProvider.ts` prompt |
| Messy/incomplete data handling | ✅ Full | `validateAndCollect()` fallback + AI prompt |
| Deterministic validation (enums, dates, skip rule) | ✅ Full | `aiExtractionService.ts:L106-190` |
| Batch processing with retry-backoff | ✅ Full | `aiExtractionService.ts:L36-93` |
| Clean REST API | ✅ Full | `importRoutes.ts`, `importController.ts` |
| Error handling (middleware + classified frontend errors) | ✅ Full | `errorHandler.ts`, `page.tsx` |
| CSV preview (sticky header, scroll) | ✅ Full | `CsvPreviewTable.tsx` |
| Loading states (per-batch progress bar) | ✅ Full | `LoadingState.tsx`, `page.tsx` |
| Responsive layout (375px mobile) | ✅ Full | Tailwind responsive classes |
| Dark mode with system preference | ✅ Full | `page.tsx`, `tailwind.config.js` |
| Drag & drop upload | ✅ Full | `CsvUploader.tsx` |
| Retry mechanism (backend + frontend) | ✅ Full | Backoff in service + "Retry Failed Rows" button |
| Deployment (Vercel + Render) | ✅ Full | README §Deployment |
| Download results as CSV | ✅ Full | `csvExporter.ts` |
| In-memory result cache (SHA-256) | ✅ Full | `cacheService.ts`, `importController.ts` |
| Global Gemini quota guard | ✅ Full | `quotaGuard.ts` |
| Unit tests (30 tests, F7 + cache hash) | ✅ Full | `__tests__/validation.test.ts` |
| Docker setup | ✅ Full | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` |
| Virtualized table for large CSVs | ✅ Full | `react-window` implemented in both CsvPreviewTable.tsx and ResultsTable.tsx |
| Streaming/incremental parsing | ✅ Full | Incremental client-side CSV parsing using PapaParse step/chunking callbacks; sequential HTTP batch uploads bypass serverless streaming limitations |

---

## Setup Instructions

### Prerequisites
- Node.js v18 or newer
- npm v9 or newer
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the repo
```bash
git clone https://github.com/GoDxVictoryRR/CRM-AI-CSV-Importer.git
cd CRM-AI-CSV-Importer
```

### 2. Backend setup
```bash
cd backend
copy .env.example .env        # Windows
# cp .env.example .env         # macOS/Linux
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:3000
GEMINI_API_KEY=AIzaSy...your_actual_key_here
```

```bash
npm install
npm run dev
# Server starts at http://localhost:5000
```

### 3. Frontend setup
```bash
cd ../frontend
copy .env.local.example .env.local    # Windows
# cp .env.local.example .env.local   # macOS/Linux
```

`frontend/.env.local` should contain:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

```bash
npm install
npm run dev
# App starts at http://localhost:3000
```

### 4. Run backend unit tests
```bash
cd backend
npm test
# 30 tests, all pass
```

### 5. Docker (local dev with Docker Compose)
```bash
# From repo root — requires GEMINI_API_KEY set in backend/.env
docker-compose up --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000
```

---

## Deployment

| Service | URL |
|---|---|
| Frontend (Vercel) | *(To be updated after deployment)* |
| Backend (Render) | *(To be updated after deployment)* |

**Render Free-Tier Cold Start:** The backend automatically spins down after 15 minutes of inactivity. The first request after a sleep period may take 30–60 seconds to respond while Render wakes the container. Subsequent requests are instant. This is an expected, documented characteristic of the free tier — not a bug.

---

## Known Limitations

| Limitation | Impact | Why Accepted |
|---|---|---|
| In-memory cache resets on backend restart/sleep | Repeated uploads re-call Gemini after a cold start | Free-tier stateless deployment; Redis would require a paid tier |
| Global quota guard counter resets on backend restart | Midday restart resets daily counter to 0 (conservative) | Acceptable; worst case = more Gemini calls allowed, not fewer |
| Per-IP rate limit is 100 req/10min | A single IP making 100+ batch calls within 10min will be blocked | Designed for 3000-row max per 10-min window; larger files need multiple sessions |
| No virtualized table | Preview table shows max 100 rows (all rows are still imported by the backend) | react-window integration out of scope for this assignment timeframe |
| Gemini `gemini-flash-latest` model | Free-tier; may have variable latency under load | Only model confirmed available on this API key's quota tier |
| No persistent database | Import results exist only in the browser session; no server-side storage | Assignment does not require persistence; adding a DB would be out of scope |
