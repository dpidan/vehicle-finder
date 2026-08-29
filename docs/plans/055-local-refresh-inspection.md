# Plan 055 — Local Refresh Inspection

## Goal

Verify the current active source feeds against local D1 after promoting the two healthy Dealer Car Search feeds.

## Run

- Applied `0015_promote_healthy_source_feeds.sql` locally with `npm run db:migrate:local`.
- Started the local app on `http://localhost:5174/` because port 5173 was already occupied.
- Ran `POST /api/admin/searches/family-replacement-vehicle/refresh` with the local admin token.
- Ran `npm run db:inspect:local` after refresh.

## Result

- Active feeds refreshed:
  - Trade Lane Motors
  - Mr. King and Mrs. Queens Auto Finance LLC
  - Texans Auto Group
  - Lone Star Auto Center
- First refresh after promotion collected 100 candidates, inserted 50 new listings, updated 50 existing listings, created 100 snapshots, and wrote 5 saved-search evaluations.
- A second refresh collected the same 100 candidates, inserted 0 new listings, updated 100 existing listings, created 100 snapshots, and wrote 5 more saved-search evaluations.
- Local inspection after the second refresh showed:
  - 151 vehicles
  - 151 listings
  - 585 listing snapshots
  - 55 search evaluations
  - 14 source feeds
  - 10 model-year risk records
  - 0 VIN decode records
  - 0 recall records
- Each active Dealer Car Search feed now reports `last_status = ok` and `last_candidate_count = 25`.

## Follow-Ups

- Source-feed health originally recorded the combined adapter count on every feed in a grouped run. That was fixed so each feed records only candidates attributed to its seller.
- Search evaluations currently accumulate historical rows; dashboard reads should continue using the latest evaluation per listing.
- VIN decode and recall caches remain empty after feed refresh alone; run enrichment separately when reviewing top candidates.
