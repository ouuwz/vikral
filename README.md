# Vikral — Phase 7: Data Integration & Evidence Validation

A responsive Digital Risk Protection workspace for Vikral. Phase 7 adds traceable evidence handling and truthful provider status reporting while preserving Phases 1–6. It does not scrape social platforms, fetch submitted URLs, bypass access controls, or claim independent verification.

## Project structure

```text
vikral/
├── frontend/
│   ├── public/vikral-mark.svg
│   ├── src/
│   │   ├── components/       # Brand mark and navigation
│   │   ├── pages/             # Landing page
│   │   ├── styles/            # Plain CSS stylesheets
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── database/connection.ts # MongoDB connection lifecycle
│   │   ├── detection/              # Normalization and similarity primitives
│   │   ├── models/brand.model.ts
│   │   ├── models/evidence.model.ts
│   │   ├── repositories/brand.repository.ts
│   │   ├── providers/          # Provider adapter contract and disabled test adapter
│   │   ├── routes/             # Health, brands, detection, monitoring, dashboard, integrations
│   │   ├── services/detection.service.ts
│   │   ├── types/brand.types.ts
│   │   ├── validation/brand.validation.ts
│   │   ├── validation/evidence.validation.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── package.json               # npm workspaces and root scripts
└── .gitignore
```

## Requirements

- Node.js **20.19+** or **22.12+**
- npm 10 or newer recommended
- Internet access for installing npm packages, loading Inter from Google Fonts, and streaming the background video

## Install

From the repository root:

```bash
npm install
```

Copy the example environment files if you want to configure ports or the frontend proxy explicitly:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

The backend requires MongoDB for Phase 2. Set `MONGODB_URI` in `backend/.env` to a local or managed MongoDB database. Do not commit this file or real credentials:

```env
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/vikral
```

The API fails clearly at startup if `MONGODB_URI` is missing or the database cannot be reached; it does not pretend that data was saved. Vite proxies `/api/*` requests to `http://localhost:3001` by default. Override that target with `VITE_API_PROXY_TARGET` in `frontend/.env` if needed.

MongoDB's actual storage files remain managed by the Windows MongoDB service. The Vikral project contains only connection, model, repository, route, validation, and type source files; it does not create a duplicate local data directory.

## Run locally

### Run both servers together

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- Backend health endpoint: <http://localhost:3001/api/health>
- Brand Profiles: <http://localhost:5173/brands>
- Social Monitoring: <http://localhost:5173/social-monitoring>
- Mobile App Monitoring: <http://localhost:5173/app-monitoring>
- Threat Intelligence Dashboard: <http://localhost:5173/dashboard>
- Data Sources: <http://localhost:5173/integrations>

### Or run them in separate terminals

Terminal 1 — backend:

```bash
npm run dev:backend
```

Terminal 2 — frontend:

```bash
npm run dev:frontend
```

## Build and type-check

```bash
# Type-check both workspaces
npm run typecheck

# Build frontend and backend
npm run build
```

The frontend production bundle is written to `frontend/dist/`; the compiled backend is written to `backend/dist/`.

To run the compiled backend after building:

```bash
npm run start:backend
```

## API endpoints

`GET /api/health` responds with HTTP `200 OK` and:

```json
{
  "status": "ok",
  "service": "vikral-api",
  "database": "connected"
}
```

The health endpoint returns HTTP `503` and `"status": "degraded"` if the database connection is lost.

The same path is available via the Vite development server at <http://localhost:5173/api/health> because of the dev proxy.

Brand profile endpoints:

- `GET /api/brands` — list saved profiles
- `POST /api/brands` — create a profile
- `GET /api/brands/:id` — retrieve one profile
- `PUT /api/brands/:id` — update a profile
- `DELETE /api/brands/:id` — delete a profile
- `POST /api/detection/analyze` — analyze one user-supplied candidate against a saved brand
- `GET /api/social-monitoring/analyses` — list the 50 most recent persisted analyses
- `GET /api/social-monitoring/analyses/:id` — retrieve one persisted analysis
- `GET /api/dashboard/overview?days=30&limit=10` — return backend-derived dashboard metrics and bounded activity
- `GET /api/integrations/status` — return sanitized provider health and configuration status

All profile bodies are validated and normalized server-side. New social accounts and mobile apps default to `unverified`; `verified` is a manual status with an evidence note, not an independent authenticity claim.

## Evidence and integrations

Every manual detection submission is normalized and stored with an evidence record in MongoDB's `evidence` collection. Records include a stable fingerprint, source classification (`user_submitted`), provider name (`manual_submission`), timestamps, validation status, normalized fields, limitations, and provenance labels. Provenance is assigned by the server; client-supplied provenance or verification claims are ignored.

Equivalent observations for the same brand produce the same SHA-256 fingerprint. A duplicate is detected before the detection engine runs, so a repeated submission returns the existing analysis with `duplicateEvidence: true` and does not create another analysis or increase dashboard counts. Changed normalized content receives a new fingerprint and preserves the earlier record.

The registered adapters include Apple's public App Store Search integration, Bluesky's public profile search, and a disabled mock provider used by automated tests. No Google Play, website, or security-intelligence provider is configured. Future provider credentials must remain in backend environment variables and are never returned to the frontend. Manual analysis continues to work without provider credentials.

### Apple App Store Search

Vikral includes one real authorized provider integration: Apple's public iTunes Search API at `https://itunes.apple.com/search`. Open Mobile App Monitoring and use the Apple App Store Search panel to submit a term, a two-letter storefront code such as `US`, and 1–10 results. Requests are made only to that fixed Apple host, use a five-second timeout and one-megabyte response limit, and are rate-limited per backend process.

Returned listings are normalized into the existing mobile-app candidate contract. Selecting **Analyze listing** uses the existing Phase 3 detection engine; it does not create a second scoring system. Provider-backed evidence is stored in the `evidence` collection with `sourceType: "authorized_api"`, `sourceProvider: "apple_itunes_search"`, and provenance labels `provider_retrieved` and `normalized`. Apple catalog presence is not independent verification.

The browser receives an opaque short-lived selection ID, while the selected listing metadata is retained server-side for the analysis request. Search results and evidence are bounded; no arbitrary URL supplied by a user is fetched.

To verify a live request:

1. Ensure MongoDB and the backend/frontend are running.
2. Open <http://localhost:5173/app-monitoring>.
3. Enter a search term such as `Vikral`, choose `US`, and choose a result limit no higher than 10.
4. Click **Search Apple** and confirm real listings appear with Apple App Store source details.
5. Select a saved brand, then click **Analyze listing** on one result.
6. Confirm the normal score, signals, limitations, and history UI appear.
7. In MongoDB, inspect the `vikral.evidence` collection and find the new record by its `sourceProvider`. It should contain `sourceType: "authorized_api"` and `provenance: ["provider_retrieved", "normalized"]`.
8. Refresh the dashboard and confirm the analysis count increases once. Repeating **Analyze listing** for the same selected record should return `duplicateEvidence: true` and should not add another analysis.

Apple API limitations: results are only what Apple's public catalog returns for the selected storefront and term; no authentication, ownership proof, private data, scheduled synchronization, or independent safety verdict is provided. This task does not add Google Play, social, crawling, or deployment integrations.

## Detection Lab

Open <http://localhost:5173/detection> to compare a candidate social account, website, or mobile app with a saved brand profile. The custom engine runs without an LLM key and returns deterministic review-priority scores from 0 to 100:

- `0–24`: low
- `25–49`: medium
- `50–74`: high
- `75–100`: critical

These are review priorities, not fraud probabilities or proof of abuse. Exact matches to verified registered social/mobile assets are returned as an explicit trusted-asset exclusion. Unverified assets are never automatically treated as trusted. Candidate URLs are not fetched, and descriptions are treated as plain text.

Optional AI context is provider-agnostic and disabled by default. Configure a future provider through backend-only variables such as `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, and `LLM_TIMEOUT_MS`; no API key is required for deterministic analysis or tests.

## Social Monitoring

Open <http://localhost:5173/social-monitoring> to search public Bluesky profiles or submit a profile manually. Bluesky search uses the official unauthenticated AppView read endpoint `https://public.api.bsky.app/xrpc/app.bsky.actor.searchActors` through `POST /api/integrations/bluesky/search`. Selecting a result calls `POST /api/integrations/bluesky/analyze`; the server retains the selected record briefly, converts it to the existing `sourceType: "social"` candidate contract, and reuses the existing detection scoring through `analyzeAndPersist`.

Bluesky search is bounded to a 1–100 character query and at most 10 results. Requests have a five-second timeout, a 512 KiB response limit, and a small local pacing guard. The public API documentation describes rate limiting but does not provide a simple fixed quota; upstream `429` responses are surfaced as unavailable search results rather than hidden. Search results are public profile metadata, not proof of ownership, authenticity, safety, or platform verification. The adapter stores a short-lived selection ID rather than trusting listing metadata sent back by the browser.

Provider-backed analyses are persisted as evidence with `sourceType: "authorized_api"`, `sourceProvider: "bluesky_public_api"`, `provenance: ["provider_retrieved", "normalized"]`, and the Bluesky DID as the original reference. Manual submissions remain `user_submitted` with `manual_submission` provenance. Profile URLs supplied manually are still not fetched. The result is a review priority, not proof that a profile is fraudulent.

## Threat Intelligence Dashboard

Open <http://localhost:5173/dashboard> for the unified Phase 6 workspace. Its metrics are calculated from the saved `brands` and `analyses` MongoDB collections:

- Registered brands: saved brand profiles.
- Recorded analyses: persisted analysis results, not confirmed incidents.
- High-priority findings: analyses rated `high` or `critical`.
- Critical findings: analyses rated `critical`.
- Social/mobile-app analyses: counts by saved `sourceType`.

Risk and source distributions use the same priority categories and source types as the detection engine. Recent activity is bounded by the dashboard API's `limit` parameter. The trend uses UTC `analyzedAt` dates from the requested `days` window and is hidden when fewer than two dated points exist; analysis volume must not be interpreted as threat prevalence. The endpoint accepts `days` from 1–90 and `limit` from 1–50.

## Mobile App Monitoring

Open <http://localhost:5173/app-monitoring> to submit Android, iOS, or other mobile-app metadata. The form requires a registered brand, platform, and app name; package ID, bundle ID, publisher, store URL, description, and observed time are optional. The request reuses `POST /api/detection/analyze` with `sourceType: "mobile_app"` and app-specific fields. Existing persisted analysis history is reused through the social-monitoring history endpoints and filtered to mobile-app results in the UI.

The deterministic engine can report app identifier and publisher mismatches when registered mobile-app records exist. Exact matching verified package IDs, bundle IDs, or store URLs receive the existing trusted-asset exclusion. Unverified records do not receive automatic exclusion. No Google Play, Apple App Store, or other store integration is implemented; submitted metadata is not independently retrieved or verified.

The backend root at <http://localhost:3001/> returns basic API information. The frontend itself is served at <http://localhost:5173/>.

## Checks

```bash
npm run typecheck
npm run build
npm test --workspace @vikral/backend
```

## Deployment

Vikral deploys as two separate services: the Vite frontend on Vercel, and the compiled Express API on Render. MongoDB Atlas is the only production persistence store; the backend exits when `MONGODB_URI` is missing or the Atlas connection fails.

### Vercel frontend

Set the Vercel project root directory to `frontend`.

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Production environment variable: `VITE_API_BASE_URL=https://<render-service>.onrender.com/api`
- Preview environment variable: use the same Render API URL unless a separate backend is explicitly configured

The frontend falls back to `/api` only for local development through the Vite proxy. Do not put MongoDB, OpenRouter, or other backend secrets in Vercel variables. `frontend/vercel.json` rewrites direct SPA routes to `index.html`.

### Render backend

The repository includes `render.yaml` for one Render Web Service. It uses:

- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

Required Render environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<database>?retryWrites=true&w=majority
CORS_ALLOWED_ORIGINS=https://<vercel-production-domain>,https://<explicit-approved-preview-domain>
```

Optional OpenRouter variables:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=<secret>
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1/chat/completions
LLM_MODEL=openai/gpt-4o-mini
LLM_TIMEOUT_MS=5000
```

Render supplies `PORT`; the API binds to `0.0.0.0`. `CORS_ALLOWED_ORIGINS` is a comma-separated allowlist of exact origins. Wildcards are not accepted in production. Bluesky and Apple requests remain on-demand provider searches; the deployment does not claim continuous monitoring.

The backend tests use an injected in-memory repository for deterministic validation and route behavior. They do not verify MongoDB persistence. To verify persistence manually, configure `MONGODB_URI`, start the API, create a profile at `/brands`, stop and restart the backend, and confirm the profile remains.

## Notes

- The background video uses the supplied CloudFront MP4 URL. If it fails to load, the page switches to a restrained CSS fallback background.
- Inter is loaded from Google Fonts; a system sans-serif fallback is specified.
- The two folders remain independently buildable through npm workspaces.
- Phase 1 intentionally contains no live threat claims or fabricated threat data.
#   h a c k a t h o n p r o j e c t 0 1  
 