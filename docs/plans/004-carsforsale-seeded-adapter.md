# Plan 004 — Carsforsale Seeded Adapter

## Objective

Implement the first live dealer adapter using explicitly supplied dealer
inventory URLs from Carsforsale.com-powered sites.

## Scope

- Add a `SellerSeed[]` fixture for selected Cypress-area dealers. Done in
  `src/sources/cypress-dealer-seeds.ts`.
- Fetch seeded inventory pages. Done in `src/sources/carsforsale-source.ts`.
- Parse visible listing cards into `ListingCandidate`. Initial parser covers
  title, price, mileage, seller, source URL, evidence, and capture timestamp.
- Keep the adapter read-only and low-frequency. Current implementation only
  reads explicitly supplied `inventoryUrl` values.
- Blocked or unavailable seed URLs are skipped without anti-bot workarounds.

## Live run notes

`npm run collect:carsforsale` on 2026-08-26 completed without crashing, but
the initial dealer-owned seed URLs did not produce normalized listings from a
plain fetch:

- `https://www.vsamotorcars.com/cars-for-sale` returned HTTP 403.
- `https://www.autolandoftexas.com/cars-for-sale` returned HTTP 403.
- `https://www.i90motorstx.com/suvs-for-sale-b100037` fetched but produced no
  first-page parser matches.

Next live attempt should try Carsforsale.com dealer profile URLs or the Dealer
Car Search format used by Trade Lane Motors before adding complexity to this
adapter.

## Deferred

- Automated dealer discovery.
- Dealer Car Search parser for dealers such as Trade Lane Motors.
- Dealer.com parser/research for dealers such as Autostrade.
- Detail-page crawling for VIN/photos/fees.
- Pagination beyond the first page.
- Persistence, deduplication, and listing snapshots.
- Browser automation or anti-bot bypasses.

Add deferred items only after the first-page adapter proves useful.
