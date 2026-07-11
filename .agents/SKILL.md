# SKILL — AI Field-Mapping Extraction (the core graded skill)

This is the most heavily evaluated part of the assignment ("AI Prompt Engineering"). Treat this
file as the spec for the AI extraction layer's behavior — implement it faithfully in the
backend's AI provider/service, not just loosely.

## Target schema (must match exactly, snake_case)
`created_at, name, email, country_code, mobile_without_country_code, company, city, state,
country, lead_owner, crm_status, crm_note, data_source, possession_time, description`

## Prompt design principles
1. **Give the model the full target schema explicitly** — field names, one-line description of
   each, and the constrained value lists for `crm_status` and `data_source` verbatim from the
   assignment. Never let the model guess the schema from examples alone.
2. **Give it the actual source column headers** for the current CSV (they vary per upload) plus
   a small sample of rows, so it can reason about ambiguous/synonymous columns (e.g. "Phone",
   "Contact No.", "Mobile" all likely map to `mobile_without_country_code`).
3. **Instruct it to output strict JSON only** — an array of objects, one per input row, each
   either a fully-mapped CRM record or an explicit skip marker with a reason. No prose, no
   markdown fences, no explanation text mixed into the output.
4. **Encode all the assignment's AI Instructions directly in the prompt**, not left implicit:
   - Only these `crm_status` values are allowed; anything else → leave blank.
   - Only these `data_source` values are allowed; anything else → leave blank.
   - `created_at` must be a value that `new Date(created_at)` in JavaScript can parse.
   - Use `crm_note` for remarks, follow-ups, extra comments, extra emails/phones, anything that
     doesn't fit another field.
   - If multiple emails exist in a row: first email → `email`, rest appended into `crm_note`.
   - If multiple phone numbers exist in a row: first number → `mobile_without_country_code`,
     rest appended into `crm_note`.
   - If a row has neither an email nor a phone number, mark it as skip — do not fabricate either.
   - Never invent data not present or reasonably inferable in the row.
5. **Batch, don't send the whole file** — one prompt per batch (see `features.md` F5), so the
   model isn't overloaded and JSON responses stay small and parseable.
6. **Ask for row-index alignment** — have the model return each result tagged with the original
   row's index/id within the batch, so the backend can reliably match AI output back to input
   rows even if a row is skipped.

## Handling ambiguous/messy columns
- Header names may be missing, renamed, abbreviated, or in different casing/spacing across
  sources (Facebook, Google Ads, Excel, real-estate CRMs, manual sheets). The prompt should
  explicitly tell the model: "column names are unreliable; infer meaning from both header text
  and sample values."
- If two columns could plausibly map to the same field, prefer the one with higher-quality/more
  complete sample values, and put the discarded one's value into `crm_note` if it looks useful.
- If a column's purpose is genuinely unclear and doesn't fit any CRM field or notes, ignore it
  rather than forcing a bad mapping.

## Output contract expected from the AI (backend must validate this, per F7 in features.md)
For each row: either a complete/partial CRM record object with the schema's field names, or a
skip indicator + short reason. The deterministic validation layer in the backend is the final
authority — it re-checks enums, date parseability, and the skip rule regardless of what the AI
claims, and corrects/blanks/skips accordingly. The prompt should reduce how often correction is
needed, but the code must never assume the AI got it right.

## Model choice (cost constraint)
- Use a **Gemini Flash model** (e.g. `gemini-2.5-flash` or `gemini-2.5-flash-lite`) — these are
  the models covered by Gemini's free, no-credit-card tier. Do not default to a Pro model; Pro
  is not available on the free tier and would break the zero-cost constraint in `rules.md`.
- Free tier is rate-limited (roughly 10-15 requests/minute and a capped number of requests/day,
  reset daily). Batch sizes and sequential/limited-concurrency processing (F5 in `features.md`)
  exist specifically to stay under this ceiling — do not increase concurrency to "go faster"
  without checking this against the current published limits first.

## Reliability
- If the AI returns invalid JSON or an unexpected shape for a batch, treat it as a batch failure
  and follow the retry logic in `bugfix-loop.md` Step 5 rather than crashing the whole import.
- A 429/rate-limit response is expected behavior on the free tier, not a bug — handle it with
  backoff-and-retry like any other transient batch failure, not as a hard error to the user.
- Keep the prompt template itself in one place (e.g. a single constant/function in the AI
  service) so it's easy to iterate on and review — this is directly part of "AI Prompt
  Engineering" evaluation, so keep it clean and well-commented (comments explaining *why* an
  instruction is in the prompt, not just restating it).