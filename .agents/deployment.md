# DEPLOYMENT — Free-Tier Hosting Instructions

Only proceed here after `testing-evaluation.md`'s full review pass is clean.

## Constraint
Use only free hosting tiers. Recommended split:
- **Frontend (Next.js)** → Vercel free tier (native Next.js support, zero-config).
- **Backend (Node.js/Express)** → Render or Railway free tier (both support persistent Node
  servers; pick whichever is available/working at build time — do not assume pricing/limits,
  verify current free-tier terms on the provider's site before committing to one).

## Steps — Backend first
1. Push the backend code to the public GitHub repo (`backend/` folder).
2. Create a new Web Service on the chosen platform (Render/Railway), pointing to the repo and
   the `backend/` subdirectory as root.
3. Set build/start commands appropriate for the TypeScript/Node setup (build step compiles TS,
   start step runs the compiled server).
4. In that platform's **environment variables / secrets dashboard**, set:
   - `GEMINI_API_KEY` = your real Gemini API key (get one free from Google AI Studio)
   - `PORT` = whatever the platform expects (many auto-inject this)
   - `NODE_ENV` = `production`
   - `FRONTEND_ORIGIN` = the frontend's deployed URL (fill this in AFTER frontend is deployed,
     then redeploy backend once known, so CORS is locked down properly)
5. Deploy and note the public backend URL (e.g. `https://your-backend.onrender.com`).
6. Sanity check: hit a simple health-check endpoint from the browser/curl to confirm it's live.

## Steps — Frontend
1. Push the frontend code to the same public GitHub repo (`frontend/` folder).
2. Import the repo into Vercel, set the project root to `frontend/`.
3. In Vercel's **environment variables dashboard**, set:
   - `NEXT_PUBLIC_BACKEND_URL` = the backend URL obtained above.
4. Deploy and note the public frontend URL.
5. Go back to the backend platform and set `FRONTEND_ORIGIN` to this frontend URL, then
   redeploy the backend so CORS allows it.

## Known free-tier tradeoff to document
Render's free web services spin down after ~15 minutes of inactivity and take 30-60 seconds to
wake up on the next request. Since a reviewer may open the hosted link cold, add a short note in
the README (e.g. "first load may take up to a minute while the free backend wakes up") so this
reads as an intentional, understood tradeoff rather than a bug.

## Post-deployment verification
- Open the live frontend URL in a normal browser (not just locally) and run through the full
  flow: upload → preview → confirm → results, using at least one messy CSV from
  `testing-evaluation.md`.
- Confirm no secrets are visible in browser devtools network requests or in the GitHub repo.
- Confirm the app works on a mobile-width browser window (responsive check).

## Optional: Docker (bonus)
- If time allows, add a `Dockerfile` for the backend (and optionally frontend) plus a
  `docker-compose.yml` for local dev parity. Keep the same env-variable approach — Docker env
  vars still come from `.env`/platform secrets, never hardcoded into the Dockerfile.

## Final checklist before emailing submission (mirrors the assignment's own checklist)
- [ ] Publicly hosted application URL works right now, cold, in an incognito window.
- [ ] Public GitHub repository URL is public (not private) and contains all code + README.
- [ ] README has exact setup/run instructions (local dev) and mentions the live deployment.
- [ ] Position applied for is decided and ready to state in the email (Intern / Full-Time).
- [ ] Email to varun@groweasy.ai includes: hosted URL, GitHub URL, and position, before the
      deadline (11 July 2026, 6 PM).