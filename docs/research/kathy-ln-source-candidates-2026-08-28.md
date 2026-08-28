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

## Decision

Prefer dealer-owned inventory pages over third-party profiles for scheduled collection, but only when the current collector can fetch them without bypass behavior. Add DealerCenter only after at least one DealerCenter site exposes stable vehicle details to plain fetch without browser automation.
