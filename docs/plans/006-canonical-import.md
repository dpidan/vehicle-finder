# Plan 006 — Canonical Import

## Objective

Persist normalized listing candidates into the existing canonical inventory
tables so live adapters can feed shared vehicles/listings before scoring from
the database.

## Scope

- Upsert vehicles, preferring VIN when present.
- Upsert sellers by name and type.
- Insert or update listings by source listing ID, falling back to URL when a
  source ID is missing.
- Insert a listing snapshot for every import pass.
- Expose a protected Worker import endpoint for the seeded Dealer Car Search
  source.
- Expose ranked persisted listings for a saved search.
- Expose listing detail with recent snapshot history.
- Expose minimal per-search listing disposition workflow.
- Include current per-search disposition in ranked persisted results.
- Expose protected persisted search-evaluation writes.
- Expose latest persisted search evaluations for a saved search.

## Deferred

- Full fallback deduplication for missing VINs.
- Evidence persistence linked to listings or snapshots.
- Search-evaluation retention and deduplication policy.
- Source-specific detail-page crawling.
- Import scheduling and stale-listing detection.
- Broader authentication/authorization beyond a private admin import token.
- Rich workflow audit history.

Add those after the live adapter can persist a useful first inventory batch.
