# Source Discovery Log

This log records source/feed trials separately from implementation plans so adapter decisions remain easy to review.

## Promotion Criteria

- Plain Worker/local fetch can access the source without bypass behavior.
- The source returns individual vehicle URLs when available.
- Listings include enough structured facts to support ranking, ideally VIN, price, mileage, exterior color, and seller.
- Pagination or feed bounds are understood well enough that small result counts are not mistaken for complete inventory.
- Terms, access posture, and duplicate behavior are acceptable for the current private family workflow.

## Healthy Or Useful Feeds

| Source | Adapter | Current status | Trial notes | Next action |
| --- | --- | --- | --- | --- |
| Trade Lane Motors | `dealer-car-search` | Active | Seeded early Dealer Car Search source; contributes normalized detail URLs and listing facts. | Keep active. |
| Mr. King and Mrs. Queens Auto Finance LLC | `dealer-car-search` | Active | Direct fetch works after parser handled linked title rows outside the first card shape. | Keep active and watch field quality. |
| Texans Auto Group | `dealer-car-search` | Active | Worker preview returned 25 VIN-backed candidates. | Watch import/dedupe health in scheduled refresh. |
| Lone Star Auto Center | `dealer-car-search` | Active | Worker preview returned 25 VIN-backed candidates. | Watch import/dedupe health in scheduled refresh. |
| Ride Motors LLC via iSeeCars | `iseecars` | Paused | Worker preview/import returned 15 VIN-backed candidates, but none matched the current family search. | Keep paused until source terms and usefulness are reviewed. |
| Ride Motors LLC JSON-LD comparison | `json-ld` | Paused | Generic schema.org parser overlaps the iSeeCars-specific source. | Use for adapter comparison, not scheduled refresh. |
| Auto Land of Texas via MyNextRide | `mynextride` | Paused | Static cards and detail URLs work; detail enrichment can add missing facts for matching listings. | Keep paused until terms and value are reviewed. |
| Listing JSON/CSV imports | `listing-json`, `listing-csv` | Manual/import only | Good for exports or browser-assisted workflows that already produce structured data. | Use on demand. |

## Blocked Or Deferred Feeds

| Source | Adapter/type | Result | Decision |
| --- | --- | --- | --- |
| Autostrade Dealer.com | `dealer-com` | Node fetched paginated WIS inventory, but local Worker fetch returned HTTP 403 from the dealer site. | Keep paused/off-schedule until a permitted Worker-compatible path or off-Worker job exists. |
| I 90 Motors sitemap | `dealer-sitemap` | Sitemap was visible, but search-relevant pages returned Datadome HTTP 403. | Seed remains blocked. |
| Spring Motors | Dealer Car Search candidate | Current URL/parser returned zero candidates. | Revisit with a better URL or parser evidence. |
| Essence Autos | Dealer candidate | Datadome/challenge page to plain fetch. | Do not automate for now. |
| Bay Motors | Dealer candidate | Datadome/challenge page to plain fetch. | Do not automate for now. |
| Ride Motors dealer-owned site | DealerCenter candidate | Direct low-frequency fetch returned Cloudflare 403/challenge content. | Use iSeeCars/JSON-LD comparison feeds instead. |
| Xpress Auto Motors | DealerCenter candidate | Direct low-frequency fetch returned Cloudflare 403/challenge content. | No adapter added. |
| Group 1 Chevrolet Spring `/llm/inventory` | Dealer-group text inventory | Data shape looked useful, but direct Worker-style fetch returned Cloudflare block pages. | Defer until a permitted fetch path or operator import workflow exists. |
| CARFAX dealer pages | Aggregator/dealer pages | Nearby dealer inventory pages returned HTTP 403. | Do not add adapter now. |
| Cars.com, Autotrader, Edmunds | Aggregators | Direct fetches were blocked or unsuitable for low-frequency Worker collection. | Prefer permitted alerts/API/import workflows later. |

## Review Rhythm

- Update this log whenever a source is added, blocked, promoted, retired, or materially changes behavior.
- Promote only a small number of healthy feeds at a time, then inspect dedupe and saved-search matches.
- Keep blocked sources in the log long enough to avoid retesting the same failed path without new evidence.
