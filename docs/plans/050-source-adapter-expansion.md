# Plan 050 — Source Adapter Expansion

## Goal

Expand source coverage without changing the canonical import path.

## Current Chunk

- Decide whether paginated Dealer.com belongs in Worker refresh or should stay as an off-Worker/manual source.
- Import paused source feeds only after they pass source-quality and runtime checks.
- Add more source types before more seeds of the same blocked runtime shape.

## Next Candidate Chunks

1. Done — find more healthy Dealer Car Search seeds near the saved-search radius.
2. Done — reviewed VSA MotorCars and Auto Land Of Texas near Kathy Ln; both are useful manual-review leads but returned HTTP 403 to the current collector.
3. Done — added Mr. King and Mrs. Queens Auto Finance LLC after a collector-style fetch returned HTTP 200.
4. Done — add a standalone CarGurus seeded dealer-profile adapter for nearby Cypress dealers.
5. Done — added a paused Dealer.com source-feed adapter for Autostrade to extract embedded WIS inventory records.
6. Done — investigated Dealer.com completeness; first-page WIS inventory can be partial when `pageInfo.totalCount` exceeds `pageInfo.pageSize`.
7. Done — ran the paginated Dealer.com feed through the local Worker source-feed endpoint; Worker fetch returned HTTP 403, so no candidates were imported.
8. Add source-quality metadata if we need to expose parsed count vs reported count in the dashboard.
9. Explore Dealer.com source-side make/model/year filters only after pagination is proven and only when the site exposes stable ordinary filter URLs.
10. Done — tested nearby DealerCenter sites; Ride Motors LLC and Xpress Auto Motors returned Cloudflare 403/challenge pages to plain fetch, so no DealerCenter adapter was added.
11. Done — added a paused iSeeCars JSON-LD adapter-development feed for Ride Motors LLC.
12. Defer browser-assisted marketplace imports until the structured dealer path has enough reliable live dealer coverage.

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

Dealer.com Worker-readiness review found a runtime split: `npm run collect:dealer-com` in Node collected 137 Autostrade listings, but `POST /api/admin/source-feeds/feed-dealer-com-autostrade/collect` through the local Worker returned HTTP 403 from the dealer site and inserted 0 candidates. The source health path correctly marked the paused feed as `error`, and a follow-up saved-search evaluation still wrote 5 current matches from existing active feeds. Keep Dealer.com paused/off-schedule until collection either runs through a permitted Worker-compatible path or is explicitly handled by an off-Worker job that posts normalized candidates back to the app.

DealerCenter review found that Ride Motors LLC and Xpress Auto Motors dealer-owned pages returned Cloudflare 403/challenge responses to direct low-frequency fetches, so a DealerCenter adapter was not added. iSeeCars was added instead as a different structured source type for Ride Motors LLC because the profile page exposes schema.org Vehicle JSON-LD with VIN, price, mileage, color, and listing redirect URLs. Keep the iSeeCars feed paused until field quality, duplicate behavior, and source terms are reviewed.

The iSeeCars feed passed a local Worker-runtime trial. `POST /api/admin/source-feeds/feed-iseecars-ride-motors/collect` previewed 15 VIN-backed candidates, then `{"import": true}` inserted 15 listings and 15 snapshots with 0 updates. A follow-up saved-search evaluation still wrote 5 matches because the imported Ride Motors inventory did not match the current family search make/model filters. This makes iSeeCars healthier than Dealer.com for Worker collection, but it should remain paused until source terms and usefulness are reviewed.
