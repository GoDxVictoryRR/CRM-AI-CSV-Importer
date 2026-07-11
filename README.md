# GrowEasy CRM AI CSV Importer

An intelligent, AI-powered CSV lead importer client and server built for **GrowEasy**. This application takes raw, arbitrary CSV files from any lead source (e.g. Facebook Ads, Google Sheets, manual lists), maps the columns intelligently to a strict CRM lead schema using **Gemini AI**, runs deterministic data validations, and shows the import results.

---

## 📋 Position Applied For
* **Position:** Software Developer (Intern / Full-Time)
* **Candidate Mode:** Immediate joining WFH

---

## 🚀 Live Hosted URLs

* **Frontend Web App:** [https://groweasy-crm-importer.vercel.app](https://groweasy-crm-importer.vercel.app) *(To be updated on deploy)*
* **Backend API Server:** [https://groweasy-crm-importer-api.onrender.com](https://groweasy-crm-importer-api.onrender.com) *(To be updated on deploy)*

> ⚠️ **Render Free Tier Note:** The backend API is hosted on a free Render tier. It will automatically spin down (sleep) after 15 minutes of inactivity. When you upload a file for the first time, the first request may take up to **50–60 seconds** to wake the server up. Subsequent requests are instant.

---

## 🛠️ Tech Stack & Key Choices

1. **Frontend:** Next.js 15 (React 18), Tailwind CSS, Lucide icons, PapaParse (client-side CSV ingestion).
2. **Backend:** Node.js, Express, Multer, TypeScript, Express-Rate-Limit (security).
3. **AI Layer:** `@google/genai` (standard Google SDK) executing on the **`gemini-flash-latest`** model.
4. **Client-Side Batching:** The frontend parses the CSV, then batches records (30 rows/batch) client-side to send chunk uploads sequentially. This gives the user **real-time progress bars** and permits **retrying failed chunks in the UI** without hitting API rate limit blocks.

---

## 💻 Running Locally

### 1. Prerequisites
* **Node.js:** v18 or newer
* **npm:** v9 or newer

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the environment template:
   ```bash
   copy .env.example .env
   ```
3. Open `backend/.env` in your editor and add your **`GEMINI_API_KEY`**:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_ORIGIN=http://localhost:3000
   GEMINI_API_KEY=AIzaSy...your_gemini_key
   ```
4. Install dependencies and start the watcher:
   ```bash
   npm install
   npm run dev
   ```

### 3. Frontend Setup
1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Copy the environment template:
   ```bash
   copy .env.local.example .env.local
   ```
3. Install dependencies and start Next.js:
   ```bash
   npm install
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## ⚙️ Implemented Rules (F7 Deterministic Layer)

Regardless of the LLM responses, our backend validation layer programmatically enforces these strict requirements:
1. **Status Mapping:** `crm_status` is forced to one of: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE` (cleared to `""` if invalid).
2. **Source Mapping:** `data_source` is forced to one of: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` (cleared to `""` if invalid).
3. **Folding emails:** If multiple emails are found, the first maps to `email`, others are appended to `crm_note` as `Extra emails: ...`.
4. **Folding phones:** If multiple phone numbers are found, the first maps to `mobile_without_country_code`, others append to `crm_note` as `Extra phones: ...`.
5. **Auto-skip:** Rows containing neither an email nor a mobile number are skipped dynamically with a validation warning.
