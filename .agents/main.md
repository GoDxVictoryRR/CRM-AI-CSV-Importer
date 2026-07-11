# MAIN — GrowEasy AI CSV Importer Assignment

## Purpose of this folder
This `.agents/` folder is the single source of truth for how you (the agent) must plan, build,
test, review, debug, and deploy this project. Read files in this order, and re-read the relevant
file before starting each phase — do not try to hold everything in context at once.

Reading order:
1. `main.md` (this file) — overview + phase sequencing
2. `architecture.md` — folder structure & data flow, read before writing any file
3. `rules.md` — global constraints (stack, style, licensing) — keep active at all times
4. `features.md` — full feature list mapped to assignment requirements
5. `feature.md` — the loop to follow for building ONE feature at a time
6. `security.md` — read before touching anything related to API keys, env vars, uploads
7. `testing-evaluation.md` — read before writing tests and before self-review
8. `bugfix-loop.md` — read only when a bug/test failure is found
9. `deployment.md` — read only after all features pass local testing
10. `agents.md` — defines the different "hats" you wear during this project and when to switch
11. `SKILL.md` — the actual AI-extraction prompt-engineering skill (the core evaluated skill)

## Project Goal
Build an **AI-powered CSV Importer** for GrowEasy CRM. Users upload any CSV export (Facebook
Leads, Google Ads, Excel exports, real-estate CRMs, manual sheets — arbitrary column names/order),
preview it, confirm import, and the backend uses an LLM (Gemini) to intelligently map arbitrary
columns into a fixed GrowEasy CRM schema, returning structured JSON with parsed + skipped records.

## Non-negotiable outcome
This is a hiring assignment. The deliverable must be:
- Publicly hosted (frontend + backend both reachable over the internet)
- On a public GitHub repo
- Have a README with exact setup steps
- Actually work end-to-end when a reviewer uploads a messy real-world CSV

## High-level phase plan (follow strictly, do not skip ahead)
1. **Scaffold** — set up repo structure per `architecture.md`, no business logic yet.
2. **Build feature-by-feature** using the loop in `feature.md`, in this order:
   a. CSV Upload (drag-and-drop + file picker)
   b. CSV Parse + Preview Table (no AI yet)
   c. Confirm → Backend API call
   d. Backend: CSV ingestion + batching
   e. Backend: AI extraction (Gemini) per `SKILL.md`
   f. Backend: structured JSON response (parsed/skipped/counts)
   g. Frontend: Results table (parsed, skipped, totals)
   h. Polish: loading states, error handling, dark mode, responsive design
3. **Test** continuously per `testing-evaluation.md` — every feature must pass its test checklist
   before moving to the next feature.
4. **Review** — after all features are built, do one full pass against `testing-evaluation.md`
   and the assignment's official evaluation criteria.
5. **Debug/fix** anything found using `bugfix-loop.md`.
6. **Deploy** using `deployment.md` only once step 3–5 are clean.
7. **Final checklist** — confirm README, hosted URL, GitHub URL, position field are all ready
   before telling the user it's done.

## Ground rule
Never write code before reading the relevant instruction file for that phase. If unsure which
file governs the current step, re-read `main.md` and `agents.md` to pick the right role/file.
