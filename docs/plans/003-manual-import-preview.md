# Plan 003 — Manual Import Preview

## Objective

Add the smallest manual-import path for pasted listing details before live
source adapters exist.

## Scope

- Accept a structured JSON listing payload through the Worker API.
- Normalize it into `ListingCandidate`.
- Optionally score it against a saved search.
- Do not persist imported listings yet.

## Deferred

- Free-text parsing.
- VIN decoding.
- Canonical vehicle/listing upsert and deduplication.
- Listing snapshots and price history.

Add those when the import preview has a real pasted-listing workflow to save.
