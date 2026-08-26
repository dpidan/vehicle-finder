# Plan 004 — Carsforsale Seeded Adapter

## Objective

Implement the first live dealer adapter using explicitly supplied dealer
inventory URLs from Carsforsale.com-powered sites.

## Scope

- Add a `SellerSeed[]` fixture for selected Cypress-area dealers.
- Fetch one seeded `cars-for-sale` inventory page at a time.
- Parse visible listing cards into `ListingCandidate`.
- Preserve source URL, dealer evidence, and capture timestamp.
- Keep the adapter read-only and low-frequency.

## Deferred

- Automated dealer discovery.
- Dealer Car Search parser for dealers such as Trade Lane Motors.
- Dealer.com parser/research for dealers such as Autostrade.
- Detail-page crawling for VIN/photos/fees.
- Pagination beyond the first page.
- Persistence, deduplication, and listing snapshots.
- Browser automation or anti-bot bypasses.

Add deferred items only after the first-page adapter proves useful.
