# Data Readiness

Use this before the first local or Worker D1 population, and again after schema changes that touch core data flow.

## Current Data Shape

- Seed user/search: `family` and `family-replacement-vehicle`.
- Seed geography: Happy Ln, Cypress, TX, 25-mile radius.
- Seed vehicle targets: Honda Odyssey, Honda Pilot, Toyota Sienna, and Honda CR-V.
- Seed risk records: initial Honda Odyssey, Honda Pilot, and Toyota Sienna model-year notes.
- Live source seed: Trade Lane Motors through the Dealer Car Search adapter.

## Local First-Run Checklist

1. Verify code and seed assumptions.

   ```sh
   npm run typecheck
   npm test
   ```

2. Apply local migrations and seed the initial search.

   ```sh
   npm run db:migrate:local
   npm run db:seed:local
   npm run db:inspect:local
   ```

   The seed script is idempotent for the initial user, saved search, and model-year risk rows.

3. Start the app.

   Create a local-only `.dev.vars` file first:

   ```sh
   cp .dev.vars.example .dev.vars
   ```

   ```sh
   npm run dev
   ```

4. Run one admin refresh from the dashboard, or call the refresh endpoint with `ADMIN_TOKEN`.

   ```sh
   curl -X POST http://localhost:5173/api/admin/searches/family-replacement-vehicle/refresh \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

5. Inspect the local DB again.

   ```sh
   npm run db:inspect:local
   ```

6. Smoke-test API reads.

   ```sh
   curl http://localhost:5173/api/searches/family-replacement-vehicle/ranked-listings
   curl 'http://localhost:5173/api/searches/family-replacement-vehicle/monitoring-summary?since=2026-08-28T00%3A00%3A00.000Z&staleBefore=2026-08-01T00%3A00%3A00.000Z'
   ```

## Expected First-Run Shape

- `users` has at least 1 row.
- `saved_searches` has at least 1 enabled row.
- `model_year_risks` has the seeded risk records.
- After a refresh, `listings`, `vehicles`, `sellers`, `listing_snapshots`, and `search_evaluations` all increase together.
- Re-running refresh should add snapshots and evaluations without duplicating VIN-backed vehicles.

## Worker D1 Checklist

Only do this after the local first-run shape looks right.

```sh
npm run db:migrate:remote
npm run db:seed:remote
npm run db:inspect:remote
```

Then deploy/run the Worker with `ADMIN_TOKEN` configured and trigger one protected refresh.
Use `wrangler secret put ADMIN_TOKEN` for deployed Workers; do not rely on local `.dev.vars` for remote configuration.

## Data Integrity Smoke Test

For each live import run, spot-check:

- Listing has a vehicle, seller, source URL, current price/mileage when available, and at least one snapshot.
- VIN-backed reruns update the same vehicle instead of creating a duplicate vehicle.
- Search evaluations exist for the saved search after refresh.
- Monitoring summary shows real new listing, price-drop, threshold, or stale signals as the data ages.
- VIN decode and recall caches remain optional enrichment caches; missing cache rows should not block ranking.

## Verified Local Run

On 2026-08-28, the local first-run path was verified with `ADMIN_TOKEN=secret` in `.dev.vars`.

- Pre-refresh inspection: 1 user, 1 saved search, 3 model-year risk rows, and 0 listings.
- First refresh: 25 collected, 25 inserted listings, 25 snapshots, and 25 evaluations.
- Second refresh: 25 collected, 0 inserted listings, 25 updated listings, 25 more snapshots, and 25 more evaluations.
- Final inspection: 25 vehicles, 1 seller, 25 listings, 50 snapshots, and 50 evaluations.
- Ranked listings and monitoring summary API reads returned live local data.
