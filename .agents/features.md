# FEATURES — Full Requirement Map

Each feature below must be built, then tested (see `testing-evaluation.md`), before moving to the
next. Treat this as the backlog; do not reorder without reason.

## F1 — CSV Upload (Frontend)
- Drag & drop zone + file picker fallback.
- Accept only `.csv`; reject other types with a clear inline error, not a silent failure.
- Basic size guard (e.g. reject absurdly large files with a friendly message) — do not hang the
  UI on huge files.
- Bonus: show upload progress if file reading is chunked.

## F2 — Preview (Frontend, no AI)
- Parse CSV client-side immediately after upload.
- Render a responsive table: horizontal scroll for many columns, vertical scroll for many rows,
  sticky header row.
- Table must work with an arbitrary, unknown number/order of columns — do not hardcode column
  names here; this step is dumb/raw preview only.
- Handle empty CSV, header-only CSV, malformed CSV gracefully with a visible error state.

## F3 — Confirm Import (Frontend → Backend trigger)
- A visible Confirm button, disabled until a valid CSV is loaded.
- On confirm: show a loading state, then call the backend import API exactly once (guard against
  double-submit).
- On backend error: show a clear, actionable error banner; allow retry without re-uploading.

## F4 — CSV Ingestion (Backend)
- Accept the uploaded CSV (as file upload or serialized rows — pick one clear contract and
  document it in the README/API docs).
- Re-parse/validate server-side; do not assume the frontend's parse is authoritative.
- Normalize rows into a generic key-value structure before AI processing (headers may vary
  wildly in name/case/spacing).

## F5 — Batching (Backend)
- Split normalized rows into batches for AI calls (do not send the entire CSV as one giant
  prompt — respect token limits and keep responses parseable).
- Process batches sequentially or with limited concurrency; do not fire unlimited parallel
  requests that could exhaust the Gemini free tier quota.

## F6 — AI Field Extraction (Backend + Gemini)
- Follow `SKILL.md` exactly for prompt design and output contract.
- For each batch: send rows + instructions, receive structured JSON mapping each row to CRM
  fields (or a "skip" marker).
- Handle AI response parsing errors defensively (AI may occasionally return malformed JSON) —
  see `bugfix-loop.md` / retry guidance in `SKILL.md`.

## F7 — Deterministic Validation Layer (Backend)
- After AI extraction, enforce in code (not just via prompt):
  - `crm_status` must be one of the 4 allowed values, else blank.
  - `data_source` must be one of the 5 allowed values, else blank.
  - `created_at` must be a value `new Date(created_at)` can parse; else blank or best-effort fix.
  - Multiple emails/phones: first one wins the field, rest appended to `crm_note`.
  - Records missing both email and mobile are moved to `skipped`, not `parsed`.
- This layer is what makes the system trustworthy even when the LLM output is imperfect.

## F8 — Structured JSON Response (Backend)
- Response shape: parsed records array, skipped records array (with a reason if easy to add),
  `totalParsed`, `totalSkipped`.
- Consistent, documented shape — this is the frontend/backend contract.

## F9 — Results Display (Frontend)
- Two clearly separated sections/tables: Parsed and Skipped.
- Totals shown prominently (Total imported / Total skipped).
- Reuse the responsive table component from F2 where sensible (don't duplicate table logic).

## F10 — Cross-cutting polish (do after F1–F9 work end-to-end)
- Loading states for: file parsing, AI processing (ideally with progress/batch count).
- Error handling states for: bad file, network failure, backend/AI failure, partial batch
  failure (some batches succeed, one fails — don't lose the successful ones).
- Responsive design across mobile/tablet/desktop.
- Dark mode (bonus).
- Empty states (no file yet, no results yet).

## F11 — Bonus features (only after core flow is solid and tested)
Priority order if time allows: drag & drop (if not already in F1), progress indicators, retry
mechanism for failed AI batches, streaming or incremental parsing (see below), virtualized table
for large CSVs, dark mode, unit tests, Docker setup, deployment, polished README. Do not
sacrifice core correctness for bonus points.

### F11a — Streaming / incremental parsing (bonus, do not skip silently)
- Frontend: for large CSVs, parse and render the preview table incrementally (e.g. chunked
  parsing that renders rows as they're read) instead of blocking the UI until the entire file is
  parsed.
- Backend: process and return AI-extracted batches incrementally where feasible (e.g. stream
  batch results back to the frontend as each batch completes — via Server-Sent Events, chunked
  HTTP response, or polling a job-status endpoint) instead of making the client wait for every
  batch across the whole file before showing any result.
- If full streaming end-to-end is too time-costly, at minimum implement incremental/chunked
  client-side CSV parsing (still a real bonus point) and clearly note in the README which half
  of "streaming or incremental parsing" was implemented and why.
