# Plan 005 — Dealer Car Search Seeded Adapter

## Objective

Try the next documented live dealer platform after Carsforsale profile and
dealer-owned pages returned HTTP 403 from plain fetch.

## Scope

- Add an explicit Trade Lane Motors seed. Done in
  `src/sources/dealer-car-search-seeds.ts`.
- Fetch the seeded inventory page. Done in
  `src/sources/dealer-car-search-source.ts`.
- Parse visible listing rows into `ListingCandidate`. Initial parser covers
  title, price, mileage, VIN, seller, source URL, evidence, and capture
  timestamp.
- Keep the adapter read-only and low-frequency.

## Live run notes

`npm run collect:dealer-car-search` on 2026-08-26 fetched Trade Lane Motors
successfully and normalized 25 listings with title, price, mileage, VIN,
seller, source URL, and capture timestamp.

Updated on 2026-08-28: listing URLs now prefer the individual `/vdp/...`
vehicle detail page exposed on each inventory card instead of the shared
inventory page.

## Deferred

- Automated dealer discovery.
- Detail-page crawling for photos and fees.
- Pagination.
- Persistence, deduplication, and listing snapshots.

Add those after a plain first-page fetch produces useful normalized listings.
