# BUGFIX LOOP — What to do when something breaks

Trigger this loop any time: a test in `testing-evaluation.md` fails, the app crashes, the AI
returns unusable output, or a previously-working feature regresses.

## Step 1 — Reproduce
- Identify the exact input (which CSV, which row, which action) that causes the failure.
- Reduce it to the smallest input that still reproduces the bug (e.g. a 2-3 row CSV instead of a
  1000-row one) before debugging further.

## Step 2 — Localize
- Determine which layer owns the bug: frontend parsing/UI, API contract mismatch, backend
  ingestion, AI prompt/response, or the deterministic validation layer (F7).
- Add temporary, minimal logging (never left in production code afterward) if the failure point
  isn't obvious.

## Step 3 — Fix at the right layer
- If the AI is inconsistent (wrong enum value, malformed JSON, wrong field mapping): first check
  whether F7's deterministic validation should simply catch/correct it — the fix usually belongs
  in code, not in trying to perfectly word the prompt for every edge case. Only adjust the
  prompt in `SKILL.md`-defined instructions if the mapping logic itself is wrong, not just to
  patch validation gaps.
- If it's a parsing bug: fix the shared CSV parsing logic, and re-test against ALL the CSV
  shapes in `testing-evaluation.md`, not just the one that failed — a CSV parsing fix can easily
  break another shape.
- If it's an API contract bug: fix the shape, update both frontend and backend types together,
  never one side alone.

## Step 4 — Guard against regression
- Re-run the full checklist in `testing-evaluation.md` for the affected feature, and re-run at
  least a quick smoke check on adjacent features that touch the same files.
- If it's a bug class likely to recur (e.g. malformed AI JSON), add a small unit test or a
  defensive check so the same bug can't silently reappear.

## Step 5 — Retry logic for AI batch failures (specifically)
- If a batch fails (network error, malformed JSON, quota hit): retry that batch a small, fixed
  number of times with backoff before giving up.
- If a batch permanently fails after retries, do not fail the whole import — mark that batch's
  rows as skipped with a reason, and still return the rows from batches that succeeded. Losing
  an entire import because one batch failed is a production-readiness failure.

## Step 6 — Close the loop
- Confirm the original failing test now passes.
- Confirm no other test in `testing-evaluation.md` newly fails.
- Return to `feature.md` Step 6 (mark done, move on) or `main.md` phase plan as appropriate.
