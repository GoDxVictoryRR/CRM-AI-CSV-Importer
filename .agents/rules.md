# RULES — Global Constraints (always active)

## Licensing / cost constraint (HARD RULE)
- Every library, framework, tool, and service used MUST be free and open-source, with the sole
  exception of the **Gemini API** (used for AI extraction, on its free tier).
- Before adding any dependency, verify its license is permissive/open-source (MIT, Apache-2.0,
  BSD, ISC). Do not add anything requiring a paid plan, paid tier, or proprietary SaaS key other
  than Gemini.
- Hosting must use free tiers only (see `deployment.md`).
- No paid database services. If a database is used, it must be free/open-source and self-hosted
  or on a free tier (e.g. SQLite file, or a free-tier hosted Postgres). Prefer **stateless**
  (no DB) since the assignment marks DB as optional — only add one if it clearly improves the
  evaluated criteria (e.g. storing import history), and justify it in the README.

## Tech stack (do not deviate)
- Frontend: **Next.js** (App Router), TypeScript, Tailwind CSS for styling.
- Backend: **Node.js** + **Express**, TypeScript preferred for type safety (an evaluation
  criterion).
- CSV parsing: an open-source CSV library (e.g. PapaParse) on both frontend (preview) and
  backend (ingestion) — pick ONE well-maintained MIT/permissive-licensed library and use it
  consistently on both sides.
- AI: Gemini API only. Design the AI-calling layer behind an interface/abstraction so a
  different provider (OpenAI, Claude) could be swapped in later without touching business logic
  — this demonstrates clean architecture even though only Gemini is actually wired up.

## Code quality bar (this is directly graded)
- TypeScript everywhere; avoid `any`. Define explicit types/interfaces for CRM records, API
  request/response shapes, and CSV row shapes.
- Clear folder structure separating: routes/controllers, services (business logic), AI
  integration layer, types, utils, and frontend components/hooks.
- Small, single-responsibility functions and components. No god-files.
- Consistent naming: snake_case only for the CRM field names themselves (must match the spec
  exactly: `created_at`, `name`, `email`, `country_code`, `mobile_without_country_code`,
  `company`, `city`, `state`, `country`, `lead_owner`, `crm_status`, `crm_note`, `data_source`,
  `possession_time`, `description`). Everything else (variables, functions, files) follows
  standard TS/JS conventions (camelCase for variables/functions, PascalCase for components/types).
- No dead code, no commented-out code blocks, no console.log left in production paths (use a
  minimal logger instead).
- Every exported function/component gets a short doc comment explaining purpose, not
  implementation detail.

## Environment & secrets
- NEVER hardcode API keys, tokens, or secrets anywhere in source files.
- All secrets come from environment variables loaded via `.env` (never committed — must be in
  `.gitignore`). See `security.md` for exact variable names and when to fill them in.
- Provide a committed `.env.example` with variable names but empty/placeholder values.

## Scope discipline
- Build exactly what `features.md` describes — no speculative extra features that aren't in the
  assignment or its bonus list, until the core flow is fully working and tested.
- Bonus features (drag-and-drop, progress indicators, streaming/incremental parsing, retry for
  failed AI batches, virtualized table, dark mode, unit tests, Docker, deployment, README) are
  attempted only after the core required flow passes `testing-evaluation.md` in full.

## Communication style while building
- Before each feature, restate in 1-2 lines what you're about to build and which requirement it
  satisfies (traceability to the assignment PDF).
- After each feature, run its test checklist from `testing-evaluation.md` before moving on.
