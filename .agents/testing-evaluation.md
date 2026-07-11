# TESTING & EVALUATION — What "done" means

This project will be graded on the criteria below. Use this file both as a test checklist per
feature (see `feature.md` Step 3) and as a full pre-submission review pass.

## Functional test checklist (run against real, messy CSVs, not just the sample)
Prepare and test with at least these CSV shapes:
1. The exact sample CRM CSV from the assignment (already-correct columns) — sanity check.
2. A Facebook Lead Export style CSV (different column names like `full_name`, `phone_number`,
   `created_time`).
3. A Google Ads Export style CSV (different naming, possibly extra tracking columns).
4. A manually created spreadsheet with inconsistent casing/spacing in headers (` Name `,
   `E-mail`, `Mobile No.`).
5. A CSV with multiple emails in one field and/or multiple phone numbers in one field.
6. A CSV with rows missing both email and mobile (must end up in skipped, not parsed).
7. A CSV with an invalid/unparseable date in a date-like column.
8. A CSV with a `status`-like column containing values that don't match any allowed
   `crm_status` enum (must end up blank, not invented).
9. A CSV with a source-like column with values outside the 5 allowed `data_source` values (must
   end up blank).
10. An empty CSV, a header-only CSV, and a CSV with only 1 data row.
11. A large CSV (hundreds/thousands of rows) to check batching, performance, and the preview
    table's usability (virtualization bonus).
12. A CSV with a line break inside a quoted field (must not corrupt row parsing).

For each, confirm:
- Preview table shows raw data faithfully, no crash, scroll/sticky header works.
- Confirm button triggers exactly one backend call.
- Backend returns parsed/skipped correctly per the AI Instructions rules in the assignment.
- Skip rule, enum rules, multi-email/phone folding rule, and date rule are all enforced
  (deterministically, not just "hopefully the AI did it").
- UI shows totals matching the actual counts.

## Non-functional / evaluation-criteria checklist
Directly mirror the assignment's evaluation categories — check off each before considering the
project submission-ready:

- **AI Prompt Engineering**: field mapping accuracy across all differently-shaped CSVs above;
  ambiguous columns resolved sensibly; messy data handled without crashing.
- **Backend Quality**: clean route/controller/service separation, sensible error responses
  (proper HTTP status codes), batching works, code is easy to follow.
- **Frontend Quality**: modern, clean UI; responsive on mobile/tablet/desktop; good preview UX;
  visible loading states; clear error states.
- **Code Quality**: TypeScript types used meaningfully (no `any` sprinkled around), consistent
  folder structure, no duplicated logic, reasonable naming.
- **Overall Engineering**: acceptable performance on a large CSV, edge cases don't crash the
  app, the app behaves like something that could ship to real users, not just a demo.

## Process for a full review pass (after all features built)
1. Re-read `features.md` top to bottom; confirm every item is actually implemented, not just
   partially.
2. Run the full functional test checklist above end-to-end against the deployed (or local)
   version.
3. Re-read `rules.md` and `security.md`; grep the repo for accidental secrets before pushing.
4. Fix anything found via `bugfix-loop.md`.
5. Only then proceed to `deployment.md`.

## Unit tests (bonus, but recommended given "Code Quality" is graded)
- Prioritize unit tests for: the deterministic validation layer (F7), CSV normalization, and the
  batching logic — these are pure functions and cheap to test well, and they demonstrate rigor
  to reviewers even without full end-to-end test infrastructure.
