# Plan 002 — Worker API Scaffold

## Objective

Create the smallest Cloudflare Worker API that proves the D1 schema and seed
data are usable through Hono routes.

## Implemented

- `wrangler.toml` defines the Worker entrypoint and local D1 binding.
- `src/worker.ts` exposes:
  - `GET /health`
  - `GET /api/sample-listings`
  - `GET /api/searches`
  - `GET /api/searches/:id`
  - `GET /api/searches/:id/ranked-sample-listings`
- `package.json` includes local development, migration, and seed scripts.
- `src/worker.test.ts` covers health, saved-search list/detail, and missing-search behavior with a fake D1 binding.
- `src/services/search-service.ts` keeps saved-search lookup and sample ranking behind a thin domain-service boundary.

## Deferred

- Authentication.
- MCP endpoint.
- Ranking/scoring against persisted listings.
- React/Vite dashboard.

Add those when the API has more behavior than read-only saved-search lookup.
