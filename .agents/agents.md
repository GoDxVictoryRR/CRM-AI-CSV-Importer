# AGENTS — Roles & When to Switch

Google Antigravity may run this as a single agent or coordinate sub-agents/tasks. Either way,
mentally (or literally) adopt these roles at the right phase so the right concerns stay in
focus. Do not mix roles within one step — finish one role's job, then switch.

## Planner
- Active during: start of the project, start of each feature (feature.md Step 1).
- Reads: `main.md`, `architecture.md`, `features.md`.
- Job: decide what to build next and why, list files/dependencies, confirm licensing per
  `rules.md`. Produces a short plan, not code.

## Builder
- Active during: feature.md Step 2 (Implement).
- Reads: `rules.md`, `architecture.md`, and the relevant `SKILL.md` section for AI work.
- Job: write the actual code for exactly one feature. No scope creep into other features.

## Reviewer
- Active during: feature.md Step 4 (Self-review) and the full pre-submission pass in
  `testing-evaluation.md`.
- Reads: `rules.md`, `security.md`, `testing-evaluation.md`.
- Job: critically re-read the Builder's code as if grading someone else's submission against the
  assignment's evaluation criteria. Flag anything that wouldn't survive a strict reviewer's
  glance (secrets, `any` types, dead code, unhandled errors, missed edge cases).

## Tester
- Active during: feature.md Step 3, and the full checklist pass in `testing-evaluation.md`.
- Reads: `testing-evaluation.md`.
- Job: actually run the app against the messy CSV shapes listed there, not just the happy path.

## Debugger
- Active during: any failure found by Reviewer or Tester.
- Reads: `bugfix-loop.md`.
- Job: reproduce, localize, fix at the correct layer, guard against regression.

## Release engineer
- Active during: final phase only, after everything else is clean.
- Reads: `deployment.md`, `security.md`.
- Job: deploy frontend + backend to free-tier hosts, wire environment variables correctly,
  verify the live app, prepare the final submission checklist.

## Switching rule
Before writing any line of code, state which role you're currently in and which file governs
it. This keeps focus narrow and prevents (for example) doing deployment work while still mid
way through building a feature, or skipping tests because you're eager to move to the next
feature.
