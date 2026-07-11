# SECURITY — Secrets, API Keys, and Safe Handling

## Golden rule
No API key, token, password, or secret is ever written directly into a source file, a committed
config file, a prompt template, or a code comment. All secrets flow through environment
variables only.

## Environment variables to define
Backend `backend/.env` (NOT committed):
```
GEMINI_API_KEY=
PORT=
NODE_ENV=
FRONTEND_ORIGIN=       # for CORS allow-list
```
Frontend `frontend/.env.local` (NOT committed), only if the frontend needs a public backend URL:
```
NEXT_PUBLIC_BACKEND_URL=
```
Also commit a `backend/.env.example` and `frontend/.env.local.example` with the same variable
names but empty values, so anyone cloning the repo knows exactly what to fill in.

## WHEN to put the real API key in
- Only after the code that reads `process.env.GEMINI_API_KEY` is written and working with a
  placeholder/mock, put the real Gemini key into `backend/.env` on your local machine to test
  the real AI extraction end-to-end.
- Never put the real key into any file that gets committed to GitHub. Double-check `.gitignore`
  includes `.env`, `.env.local`, and any other env file before the first commit.

## WHERE to put the real API key for deployment
- When deploying the backend (Render/Railway/Vercel serverless functions/etc. — see
  `deployment.md`), set `GEMINI_API_KEY` as a **secret/environment variable in that platform's
  dashboard**, never inside the repo. The same applies to `FRONTEND_ORIGIN`.
- When deploying the frontend, set `NEXT_PUBLIC_BACKEND_URL` as an environment variable in the
  frontend hosting platform's dashboard, pointing to the deployed backend's public URL.
- After deployment, verify no `.env` file was accidentally included by checking the GitHub repo
  contents directly.

## Input safety
- Validate uploaded files are actually CSV (extension + basic content sniff), reject others.
- Enforce a reasonable max file size/row count server-side to avoid resource exhaustion.
- Never `eval` or dynamically execute anything derived from CSV content.
- Sanitize any CSV field before it could be interpreted as a formula by spreadsheet software if
  the data is ever re-exported as CSV (avoid CSV injection: prefix cells starting with
  `=`, `+`, `-`, `@` with a safety character if writing CSV back out).

## API safety
- Enable CORS only for the known frontend origin(s), not `*`, once deployed.
- Add basic rate limiting / request size limits on the upload endpoint (an open-source
  Express middleware is fine) to avoid abuse of the free Gemini quota.
- Return generic error messages to clients; log detailed errors server-side only — never leak
  stack traces or API key fragments in API responses.

## AI-specific safety
- Treat the AI's output as untrusted input: always run it through the deterministic validation
  layer (`F7` in `features.md`) before returning it to the client or trusting field values like
  `crm_status`/`data_source`.
- Never forward the raw Gemini API key or provider internals to the frontend.
