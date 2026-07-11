# Tasks — GrowEasy CRM AI CSV Importer

- `[x]` Phase 1: Scaffold Repository Structure
  - `[x]` Create root configuration files (`.gitignore`, `README.md`)
  - `[x]` Create backend configuration files (`package.json`, `tsconfig.json`, `.env.example`)
  - `[x]` Create backend base entrypoints (`src/index.ts`, `src/types/crm.ts`)
  - `[x]` Create frontend configuration files (`package.json`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `.env.local.example`)
  - `[x]` Create frontend base entrypoints (`app/layout.tsx`, `app/page.tsx`, `app/globals.css`)
  - `[x]` Install dependencies for backend and frontend
  - `[x]` Verify backend and frontend build successfully

- `[x]` Phase 2: Core Feature Implementation
  - `[x]` F1: CSV Upload UI (Drag & drop, type filter, size guard)
  - `[x]` F2: Client-side CSV Parse & Preview Table (No AI yet, responsive scroll, sticky headers)
  - `[x]` F3: Confirm Import Bar (Single trigger backend call, spinner, submit guard)
  - `[x]` F4: Backend API Endpoint & server-side CSV Parse (multer, rateLimiter, csvService)
  - `[x]` F5: Sequenced batching logic (Sequential processing for Gemini free tier rate limits)
  - `[x]` F6: Gemini AI extraction (Prompt mapping per rules, response parser)
  - `[x]` F7: Deterministic validation layer (Strict status/source enums check, invalid date cleanup, email/mobile check)
  - `[x]` F8: Structured JSON output contract
  - `[x]` F9: Results table UI (Parsed vs Skipped lists, totals cards)

- `[x]` Phase 3: Verification & Polish (F10)
  - `[x]` Verify core import flow end-to-end with messy CSV inputs
  - `[x]` Show progress indicator during AI processing ("Processing batch X of Y")
  - `[x]` Build classified, actionable validation/network/server error states
  - `[x]` Enable horizontal scroll layouts for mobile screen viewports (375px)

- `[x]` Phase 4: High-Value Bonuses (Group 2)
  - `[x]` Dark mode selector (respects system preference + manual light/dark switch)
  - `[x]` Retry Failed Rows in UI (allows importing skipped/error entries directly)
  - `[x]` Overwrite root README.md with setup instructions and submission data

- `[ ]` Phase 5: Deployment & Group 3 (Next)
  - `[ ]` Host frontend on Vercel and backend on Render
  - `[ ]` Group 3 bonuses (Unit tests, Docker setup, virtualized table)
