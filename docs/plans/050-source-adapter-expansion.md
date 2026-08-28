# Plan 050 — Source Adapter Expansion

## Goal

Expand source coverage without changing the canonical import path.

## Current Chunk

- Verify Dealer.com source completeness before treating its embedded first-page inventory as a reliable feed.
- Use normal Dealer.com pagination links/query parameters where available; do not add browser automation or anti-bot behavior.
- Keep large-source filtering as a collection optimization only; our saved-search eligibility filter remains the final gate.

## Next Candidate Chunks

1. Done — find more healthy Dealer Car Search seeds near the saved-search radius.
2. Done — reviewed VSA MotorCars and Auto Land Of Texas near Kathy Ln; both are useful manual-review leads but returned HTTP 403 to the current collector.
3. Done — added Mr. King and Mrs. Queens Auto Finance LLC after a collector-style fetch returned HTTP 200.
4. Done — add a standalone CarGurus seeded dealer-profile adapter for nearby Cypress dealers.
5. Done — added a paused Dealer.com source-feed adapter for Autostrade to extract embedded WIS inventory records.
6. Done — investigated Dealer.com completeness; first-page WIS inventory can be partial when `pageInfo.totalCount` exceeds `pageInfo.pageSize`.
7. Add source-quality metadata if we need to expose parsed count vs reported count in the dashboard.
8. Explore Dealer.com source-side make/model/year filters only after pagination is proven and only when the site exposes stable ordinary filter URLs.
9. Defer browser-assisted marketplace imports until the structured dealer path has enough reliable live dealer coverage.

## Guardrails

- Use explicit seed URLs before automated dealer discovery.
- Do not add anti-bot bypass behavior.
- Keep collectors read-only and low-frequency.
- Treat detail-page photo/VIN crawling as a separate chunk.

## Result

The Carsforsale adapter now preserves vehicle detail links when the inventory HTML exposes them. The Dealer Car Search seed list also now includes Future Cars, Texaz Motors, CarCafe LLC, and C.P. Auto Sales; `npm run collect:dealer-car-search` returned 49 normalized listings after the expansion. This makes imported listings actionable from the dashboard and monitoring digest instead of sending the buyer back to a broad inventory page.

VSA MotorCars and Auto Land Of Texas were reviewed as nearby dealer-owned inventory candidates after the Kathy Ln source review. Both are close Cypress independent dealers with useful visible inventory, but `npm run collect:dealer-car-search` returned HTTP 403 for their dealer-owned pages, so they were not added to the automated seed list.

Mr. King and Mrs. Queens Auto Finance LLC was added to the automated Dealer Car Search seed list after a collector-style fetch returned HTTP 200. A small parser update handles Dealer Car Search pages that expose multiple linked title rows outside the old `i17r-vehicle` card shape. `npm run collect:dealer-car-search` now returns 72 listings total; this new source currently contributes individual vehicle detail URLs and prices, with VIN/mileage detail-page enrichment left for a later chunk.

CarGurus dealer-profile collection was added as a standalone source type using explicit Cypress-area seeds for Toyo Financial Group and VSA Motorcars. `npm run collect:cargurus` returned 35 normalized listings with VIN, price, mileage, exterior color, seller, and CarGurus listing/profile URL. Keep it out of scheduled refresh until duplicate behavior, field quality, and source terms are reviewed.

Dealer.com collection was added as a standalone source type using Autostrade as the first explicit source feed. The adapter reads Dealer.com's embedded WIS inventory JSON and extracts title, vehicle detail URL, price, mileage, VIN, exterior color, seller, and status. The feed is seeded as `paused` so it can be manually collected and compared against existing VIN dedupe behavior before joining scheduled refresh.

Dealer.com completeness review found that Autostrade's initial inventory page exposed `pageInfo.totalCount: 137`, `pageInfo.pageSize: 24`, and `pageInfo.pageStart: 0`, so the original 24-listing adapter result was only the first page. The adapter now follows ordinary `?start=` pagination up to a bounded page limit and combines all embedded WIS inventory pages before normalization. For very large dealers, prefer source-side filters only when they are stable and visible in normal page/filter URLs; still apply our own saved-search filter after import because source filters are inconsistent across platforms.
