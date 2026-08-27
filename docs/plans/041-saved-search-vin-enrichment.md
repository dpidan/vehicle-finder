# 041 - Saved Search VIN Enrichment

## Goal

Make cached VIN decoding useful for an existing saved search without coupling scheduled refresh to an external API.

## Scope

- Add an admin-triggered route to decode VINs from listings already evaluated for a saved search.
- Reuse the single-VIN cache so repeat runs skip network calls.
- Return counts for candidates, live decodes, cache hits, and failures.

## Non-goals

- Do not run VIN decoding during every scheduled refresh yet.
- Do not overwrite canonical vehicle rows from decode results yet.
- Do not decode more than a small batch per request until operational limits are clearer.

## Result

Implemented a small batch runner over distinct VINs from the saved search's evaluated listings. The first pass is capped at 50 VINs so it is useful for the family search while staying polite to NHTSA vPIC and Cloudflare request limits.
