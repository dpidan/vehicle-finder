# Project Plan

## Problem

Finding a good used vehicle at the lower end of the market requires repeatedly checking fragmented sources and judging much more than asking price and mileage. The tool should surface good opportunities quickly and explain why they are good or risky.

## Product goals

1. Aggregate candidate used vehicles from multiple permitted sources.
2. Normalize listings into a common schema.
3. Deduplicate the same physical vehicle across multiple sources, ideally by VIN.
4. Track listing snapshots, price changes, mileage changes, and first/last seen timestamps.
5. Enrich vehicles with VIN data, recalls, model-year reliability knowledge, and maintenance expectations.
6. Support multiple users and multiple saved searches.
7. Rank a shared inventory differently for each search.
8. Explain ranking through transparent score factors rather than a black-box number.
9. Highlight new listings, price drops, unusually good value, suspiciously low prices, and likely near-term maintenance costs.
10. Keep deployment free or very inexpensive for personal/family use.

## Initial users and searches

The first user will have a family replacement-vehicle search. Additional searches may be created later for a son, daughter, or other family member with very different vehicle types, budgets, priorities, and risk tolerances.

### Initial family search

- Center: Kathy Ln, Cypress, TX.
- Default radius: 25 miles; configurable.
- Cash tier: target <= $10,000.
- Stretch tier: target <= $15,000.
- Preferred makes: Honda and Toyota.
- Primary models: Odyssey, Pilot, Sienna.
- Secondary model: CR-V.
- Minimum seating: 5.
- Preferred seating: 7-8.
- Seller types: dealer and private.
- Strong preference for clean title.
- Salvage/rebuilt/flood/lemon/buyback normally excluded.

### Initial mileage guidance

These are soft defaults, not hard universal limits:

- Cash ideal: <= 120k miles.
- Cash soft ceiling: around 140k with excellent condition/history.
- Stretch ideal: <= 100k miles.
- Stretch soft ceiling: around 120k miles.

Maintenance history and condition should be capable of outweighing moderate mileage differences.

## Source strategy

Planned source categories include:

- Local independent dealers.
- Large/franchise dealers.
- Dealer-group inventory sites.
- Autotrader and similar aggregators where permitted integrations or alert workflows are available.
- Facebook Marketplace through a compliant assisted/import workflow if no suitable buyer-side API exists.
- Nextdoor, subject to current API/access terms and available marketplace-search capabilities.

Each source is implemented behind an adapter and classified by access type, such as official API, structured web data, notification import, or browser-assisted workflow.

## Product phases

### Phase 0 — domain definition

- Search configuration schema.
- Model/year knowledge structure.
- Scoring definitions.
- Canonical vehicle/listing model.
- Source adapter contract.

### Phase 1 — useful without a polished UI

- Database schema.
- One or two dealer/source adapters.
- Listing normalization and deduplication.
- Search evaluator.
- Vehicle Score and Deal Score.
- Ranked JSON/HTML output.

### Phase 2 — enrichment and history

- VIN decoding/enrichment.
- Recall lookup.
- Listing snapshots and price history.
- Maintenance/risk knowledge.
- Effective purchase-cost calculation.
- "Why is this cheap?" anomaly flags.

### Phase 3 — interactive dashboard

- User/search selector.
- Filtering and sorting.
- Listing detail view.
- Favorite/interested/contacted/rejected workflow.
- Rejection reasons.
- Compare candidates.

### Phase 4 — monitoring

- Scheduled collection.
- New-listing and price-drop detection.
- Search-specific notification thresholds.
- Digest/reporting options.

## Open decisions

- Final frontend framework: React/Vite + Hono is currently favored; Astro and other lightweight options remain candidates.
- D1 schema/ORM choice.
- Authentication approach for a simple family-only multi-user deployment.
- Exact acquisition approach for each marketplace/aggregator.
- How much historical vehicle-report data can be obtained legally and economically without paid services.
