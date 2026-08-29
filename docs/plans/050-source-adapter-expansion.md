# Plan 050 — Source Adapter Expansion

## Goal

Expand source coverage without changing the canonical import path.

## Current Chunk

- Decide whether paginated Dealer.com belongs in Worker refresh or should stay as an off-Worker/manual source.
- Import paused source feeds only after they pass source-quality and runtime checks.
- Add more source types before more seeds of the same blocked runtime shape.
- Use dashboard source-feed Preview and Import controls for single-feed trials before enabling feeds in scheduled refresh.

## Next Candidate Chunks

1. Done — find more healthy Dealer Car Search seeds near the saved-search radius.
2. Done — reviewed VSA MotorCars and Auto Land Of Texas near Kathy Ln; both are useful manual-review leads but returned HTTP 403 to the current collector.
3. Done — added Mr. King and Mrs. Queens Auto Finance LLC after a collector-style fetch returned HTTP 200.
4. Done — add a standalone CarGurus seeded dealer-profile adapter for nearby Cypress dealers.
5. Done — added a paused Dealer.com source-feed adapter for Autostrade to extract embedded WIS inventory records.
6. Done — investigated Dealer.com completeness; first-page WIS inventory can be partial when `pageInfo.totalCount` exceeds `pageInfo.pageSize`.
7. Done — ran the paginated Dealer.com feed through the local Worker source-feed endpoint; Worker fetch returned HTTP 403, so no candidates were imported.
8. Done — added last candidate count to source-feed health and dashboard display.
9. Explore Dealer.com source-side make/model/year filters only after pagination is proven and only when the site exposes stable ordinary filter URLs.
10. Done — tested nearby DealerCenter sites; Ride Motors LLC and Xpress Auto Motors returned Cloudflare 403/challenge pages to plain fetch, so no DealerCenter adapter was added.
11. Done — added a paused iSeeCars JSON-LD adapter-development feed for Ride Motors LLC.
12. Done — checked CARFAX dealer inventory pages for nearby dealers; direct fetch returned HTTP 403, so no CARFAX adapter was added.
13. Done — add a paused MyNextRide source adapter for Auto Land of Texas with bounded ordinary pagination and individual vehicle detail URLs.
14. Done — add paused Spring/Tomball source candidates for Dealer Car Search and Carsforsale-powered dealers.
15. Done — checked Group 1 Chevrolet Spring `/llm/inventory` as a potential high-value text inventory source; direct fetch is Cloudflare-blocked.
16. Done — add a sitemap-guided dealer source type that discovers search-relevant make/model pages before parsing vehicle cards.
17. Done — add a generic JSON-LD vehicle source type for standards-shaped embedded vehicle data.
18. Done — add generic listing JSON and CSV import adapters for dealer/export/browser-assisted listing data.
19. Done — add a GotGoodCars dealer inventory adapter after finding an accessible Spring-area source.
20. Defer browser-assisted marketplace imports until the structured dealer path has enough reliable live dealer coverage.

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

Source feed health now stores and displays the last candidate count, which makes zero-result success/failure and small-feed trials easier to inspect from the dashboard. CARFAX dealer inventory pages were also checked for Ride Motors LLC, VSA MotorCars, and Toyo Financial Group, but all returned HTTP 403 to direct fetches, so CARFAX stays out of the adapter set for now.

Dashboard source-feed controls now let an operator load feeds, preview a single feed, inspect VIN overlap, and import a selected active feed without running every source. Imported feed data rewrites the selected saved search's evaluations afterward, so the dashboard can show matching candidates immediately while still keeping notification delivery and feed metadata editing out of scope.

MyNextRide collection was added as a standalone source type using Auto Land of Texas as the first explicit source feed. The adapter reads static inventory card HTML, preserves individual `/cars-for-sale/...` detail URLs, follows normal `?page=N` pagination up to a bounded cap, and dedupes repeated listing URLs across pages. The feed is seeded as `paused` because MyNextRide lists its content ownership/reuse language in the footer and because this source currently exposes title, mileage, and detail URLs more reliably than VIN/price.

Detail enrichment now lives in the source-feed service instead of in a source-specific route. Adapters can optionally implement `enrichDetail`, and the service calls it only for shallow candidates that match at least one supplied enabled saved search. This keeps detail-page fetching bounded for multiple users: one global source pass, targeted enrichment for candidates relevant to current searches, then normal global import and per-search evaluation.

Spring/Tomball source coverage now includes paused source feeds for Texans Auto Group, Lone Star Auto Center, Spring Motors, Essence Autos, and Bay Motors. Texans Auto Group and Lone Star Auto Center previewed cleanly through the Worker with 25 VIN-backed Dealer Car Search candidates each. Spring Motors returned zero candidates with the current URL/parser, and Essence Autos plus Bay Motors returned Datadome/challenge pages to plain fetch, so those three stay paused as adapter/source follow-ups rather than scheduled feeds.

Group 1 Chevrolet Spring's `/llm/inventory/?type=used` page remains a strong data-shape candidate because search results expose VIN, price, mileage, and detail links, but direct Worker-style fetches returned Cloudflare block pages even with ordinary browser request headers. Do not add a Group1 adapter until there is a permitted fetch path or an approved off-Worker/import workflow.

Dealer sitemap collection was added as a standalone source type using I 90 Motors as the first explicit feed. The adapter reads public XML sitemap URLs, selects make/model inventory pages that match enabled saved searches, and then reuses the Carsforsale card parser so detail URLs, prices, mileage, colors, and titles are handled consistently. This source shape is useful for larger dealers because it avoids fetching every broad inventory page when a search can narrow the page set up front. I 90 is seeded as `blocked` because its sitemap is visible but search-relevant pages returned Datadome HTTP 403 during the adapter trial.

Generic JSON-LD vehicle collection was added as another standalone source type. It reads schema.org-style `Vehicle`, `Car`, or `Product` records from supplied pages, normalizes title, VIN, year/make/model, price, mileage, exterior color, photo URLs, and evidence, and stays behind the same source-feed registry as the other adapters. Ride Motors LLC is seeded as a paused JSON-LD comparison feed because it overlaps the existing iSeeCars-specific adapter.

Listing JSON and CSV import adapters were added for source data that already arrives as an export instead of a website scrape. They accept simple listing fields such as URL, title, year, make, model, VIN, price, mileage, exterior color, seller, and description, then route through the normal candidate/import path. No seed feeds were added because these adapters need a real export URL or temporary operator-provided file endpoint.

GotGoodCars collection was added as another standalone source type using Uptown Imports in Spring as the first explicit feed. The adapter reads ordinary WordPress inventory cards, follows `?paged=N` pagination up to a bounded cap, and preserves detail URLs, stock IDs, prices, mileage, exterior colors, and photos. A standalone local run returned 74 candidates; the feed is seeded as `paused` until it passes Worker/dashboard preview and dedupe review.
