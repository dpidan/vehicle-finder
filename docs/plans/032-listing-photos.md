# Plan 032 - Listing Photos

## Objective

Show listing photos in the dashboard when a source provides image URLs.

## Scope

- Store listing and snapshot photo URLs as JSON arrays.
- Carry photo URLs through canonical candidates and listing details.
- Let manual imports include pasted photo URLs.
- Render a small photo strip in the listing detail panel.

## Deferred

- R2 image caching.
- Image deduplication/fingerprinting.
- Adapter-specific detail-page photo crawling.
