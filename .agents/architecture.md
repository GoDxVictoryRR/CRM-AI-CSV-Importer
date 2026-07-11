# ARCHITECTURE — Structure & Data Flow

## Repository layout (monorepo, two top-level apps)
```
repo-root/
  frontend/         Next.js app
  backend/          Node.js + Express app
  .agents/          (this folder — not shipped as product code, but kept in repo for transparency)
  README.md         setup + run + deploy instructions
  .gitignore        must exclude .env, node_modules, build output
```
Do not merge frontend and backend into a single Next.js API-routes app — the assignment
explicitly asks for Frontend (Next.js) + Backend (Node.js/Express) as distinct components, and
separate backend demonstrates real API design, which is graded.

## Frontend structure (inside `frontend/`)
- `app/` — routes (App Router). Single main page is enough (upload → preview → confirm →
  results), but keep it composed of small components, not one giant page file.
- `components/` — `CsvUploader`, `CsvPreviewTable`, `ConfirmImportBar`, `ResultsTable`,
  `LoadingState`, `ErrorBanner`, etc.
- `lib/` — CSV parsing helper, API client (fetch wrapper), shared types imported/mirrored from
  backend contract.
- `types/` — TypeScript interfaces for CRM record, API responses.
- `hooks/` — e.g. `useCsvUpload`, `useImportResult` if state logic grows.

## Backend structure (inside `backend/`)
- `src/routes/` — Express route definitions only (thin).
- `src/controllers/` — request/response handling, calls services.
- `src/services/csvService.ts` — CSV parsing into raw rows.
- `src/services/aiExtractionService.ts` — batches rows, calls the AI provider abstraction,
  assembles structured CRM records, applies validation rules (allowed enums, skip rules,
  multi-email/phone folding) as a safety net even if the AI already tries to follow them.
- `src/ai/` — provider abstraction (`AIProvider` interface) + `geminiProvider.ts` implementation.
- `src/types/` — CRM record type, request/response DTOs shared conceptually with frontend.
- `src/middleware/` — file upload handling, error handling, request validation, CORS.
- `src/utils/` — logger, batching helper, response formatter.

## Data flow (must match exactly)
1. Frontend: user uploads CSV → parsed **client-side only** for preview (no backend call yet).
2. Frontend: preview table renders raw rows as-is (no AI, no field mapping) with sticky headers,
   horizontal/vertical scroll, responsive layout.
3. User clicks Confirm → frontend sends the raw CSV (or parsed rows) to backend via a single API
   call (e.g. `POST /api/import`).
4. Backend: parses/re-validates CSV server-side (never trust client-only parsing for the real
   pipeline), splits rows into batches (batch size configurable, sensible default e.g. 20-50
   rows/batch depending on token limits).
5. Backend: sends each batch to Gemini via the AI provider abstraction with the extraction prompt
   defined in `SKILL.md`.
6. Backend: validates AI output against the enum rules and skip rules from the assignment
   (`crm_status`, `data_source`, missing email+mobile ⇒ skip) as a deterministic safety net —
   never trust the AI's output blindly for constrained fields.
7. Backend: returns JSON: `{ parsed: CRMRecord[], skipped: RawRow[], totalParsed: number,
   totalSkipped: number }`.
8. Frontend: renders results table with parsed/skipped/totals per the spec.

## Design principle
Keep the AI provider swappable (interface + one concrete implementation for Gemini) and keep
validation/business rules in backend code, not solely delegated to the prompt — this is what
"clean architecture" and "production readiness" mean in the evaluation criteria.
