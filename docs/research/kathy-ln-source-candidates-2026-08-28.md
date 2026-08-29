# Kathy Ln Source Candidates — 2026-08-28

## Goal

Find varied, permitted source candidates roughly within 10 miles of Kathy Ln in Cypress, TX.

## Plain-Fetch Result

The best nearby dealer-owned candidates expose useful listing data in browser/search snapshots, but returned HTTP 403 when tested through the current low-frequency Node/Worker-style collector. Keep them out of scheduled refresh until there is a permitted plain-fetch path.

Verified command: `npm run collect:dealer-car-search`

Result: VSA MotorCars and Auto Land Of Texas returned HTTP 403; existing healthy Dealer Car Search seeds still returned 49 normalized listings.

Mr. King and Mrs. Queens Auto Finance returned HTTP 200 to the same collector-style fetch, so it was added to the automated Dealer Car Search seed list. The live collector now returns 72 listings total; this source currently contributes individual detail URLs and prices, with VIN/mileage detail-page enrichment left as a follow-up.

## Nearby Dealer-Owned Candidates

| Source | Address / Area | Source type | Adapter path | Notes |
|---|---|---|---|---|
| Mr. King and Mrs. Queens Auto Finance LLC | 11830 Jones Road, Houston, TX 77070 | Independent dealer site | `dealerCarSearchSource` | Direct collector-style fetch returned HTTP 200. Added to automated seeded collection; detail URLs and prices normalize now, with VIN/mileage enrichment as a follow-up. |
| VSA MotorCars | 12212 Cypress N. Houston RD, Cypress, TX 77429 | Independent dealer site | Manual import or future permitted fetch path | Search showed about 34-45 active vehicles. Inventory pages expose titles, prices, mileage, exterior color, and detail links in snapshots, but direct collector fetch returned HTTP 403. |
| Auto Land Of Texas | 12001 Cypress N Houston Rd., Cypress, TX 77429 | Independent dealer site | Manual import or future permitted fetch path | Search showed about 36-41 active vehicles, including family-relevant SUVs/minivans. Inventory pages expose titles, prices, mileage, drivetrain, and detail links in snapshots, but direct collector fetch returned HTTP 403. |

## Nearby Follow-Up Sources

These are useful candidates, but should not enter scheduled refresh until their fetch behavior and terms are checked.

| Source | Address / Area | Source type | Likely adapter | Current call |
|---|---|---|---|---|
| Xpress Auto Motors | 11714 Cypress North Houston Rd, Cypress, TX 77429 | DealerCenter dealer site | New DealerCenter adapter or skip | Homepage is reachable, but current inventory snapshot did not expose vehicle cards. Keep as research. |
| Ride Motors LLC | 19005 FM 529 Rd STE 9G, Cypress, TX 77433 | DealerCenter dealer site | New DealerCenter adapter or skip | Search result showed DealerCenter inventory shell. Needs direct vehicle-card proof before implementation. |
| Toyo Financial Group | 22226 Northwest Fwy, Cypress, TX 77429 | Independent dealer / aggregator profile | Aggregator/manual import | CarEdge showed inventory summary, but use dealer site or manual import before scraping aggregator profiles. |
| Autotrader dealer pages | Nearby Cypress dealers | Aggregator | Alert/manual import first | Useful for discovery and manual review. Avoid automated scraping unless a permitted integration path is identified. |

## Added as Standalone Adapter Targets

These sources are intentionally collected with separate scripts first. They are useful for adapter development and dedupe testing, but should not be mixed into scheduled refresh until their duplicate behavior and field quality are reviewed.

| Source | Address / Area | Source type | Adapter path | Notes |
|---|---|---|---|---|
| Toyo Financial Group on CarGurus | 22226 Northwest Fwy, Cypress, TX 77429 | Aggregator dealer profile | `cargurusSource` | Direct fetch returned HTTP 200 with visible VINs and listing IDs. Useful to test aggregator-profile parsing and VIN dedupe against dealer-owned sources. |
| VSA Motorcars on CarGurus | 12212 Cypress N. Houston RD #1, Cypress, TX 77429 | Aggregator dealer profile | `cargurusSource` | Direct fetch path was added as a seed because the dealer-owned VSA page returned HTTP 403 to the current collector. |
| Ride Motors LLC on iSeeCars | 19005 FM 529 Rd STE 9G, Cypress, TX 77433 | Aggregator dealer profile | `iseecarsSource` | Direct fetch returned HTTP 200 and exposed schema.org Vehicle JSON-LD with VIN, price, mileage, color, and listing redirect URLs. Useful to test JSON-LD source parsing against a DealerCenter-backed dealer whose own site blocks plain fetch. |

Verified command: `npm run collect:cargurus`

Verified result: 35 normalized listings across Toyo Financial Group and VSA Motorcars, including VIN, price, mileage, exterior color, seller, and CarGurus listing/profile URL.

Verified command: `npm run collect:iseecars`

Verified result: Ride Motors LLC returned normalized listings from iSeeCars Vehicle JSON-LD. Keep this feed paused until terms, duplicate behavior, and field quality are reviewed.

## Decision

Prefer dealer-owned inventory pages over third-party profiles for scheduled collection, but only when the current collector can fetch them without bypass behavior. Add DealerCenter only after at least one DealerCenter site exposes stable vehicle details to plain fetch without browser automation.
