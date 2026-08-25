# Project Plan

## Problem

Finding a good used vehicle at the lower end of the market requires repeatedly checking fragmented sources and judging much more than asking price and mileage. The tool should surface good opportunities quickly and explain why they are good or risky.

The first use case is an urgent personal/family purchase, but the product should be shaped so it can later support any make/model, many vehicle categories, public users, and paid or premium data sources without rebuilding the core model.

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
10. Keep the domain model generic. Make/model preference, vehicle role, budget, risk tolerance, and optimization goal are saved-search configuration, not application constants.
11. Support portable and extensible data structures so new attributes, evidence types, enrichment sources, and scoring factors can be added deliberately.
12. Track buyer workflow state and next actions so the tool helps users act quickly, not only rank listings.
13. Keep deployment free or very inexpensive for personal/family use while leaving room for public-product growth and monetization.
14. Provide an MCP interface so ChatGPT can query saved searches, ranked candidates, listing details, score explanations, and user workflow state.

## Product posture

The application should eventually be a general used-vehicle search assistant, not a Honda/Toyota-specific family-car tool. Initial defaults may target one user's search, but the schema, scoring services, source adapters, and UI should work for arbitrary makes, models, body styles, budgets, geography, and user priorities.

Public-product language should be conservative. The system can flag risk signals, missing data, inconsistencies, and suggested verification steps, but should avoid definitive claims about seller intent or vehicle condition without evidence.

## Initial users and searches

The first user will have a family replacement-vehicle search. Additional searches may be created later for a son, daughter, other family member, or public users with very different vehicle types, budgets, priorities, and risk tolerances.

### Initial family search

- Purchase timeframe: about 3 weeks.
- Center: Kathy Ln, Cypress, TX.
- Default radius: 25 miles; configurable; willing to consider a larger radius for a much better candidate.
- Cash tier: target <= $10,000.
- Stretch tier: target <= $15,000.
- Financing is acceptable when the higher price buys a meaningfully better vehicle, but cash candidates should remain strongly preferred.
- Preferred makes/models are configured on the saved search, not hard-coded. Initial seed preferences may include Honda Odyssey, Honda Pilot, Toyota Sienna, Honda CR-V, and other reliable/value candidates.
- Minimum seating: 5.
- Preferred seating: 7-8; third row is strongly preferred but not mandatory.
- Seller types: dealer and private.
- Private-party purchases are acceptable if inspection and evidence are strong.
- Strong preference for clean title.
- Salvage/rebuilt/flood/lemon/buyback normally excluded.
- Preferred pre-purchase inspection mechanic: Corb's Auto on Grand Rd. in Cypress, TX.
- Immediate maintenance budget assumption: less than $800 after purchase.

### Initial mileage guidance

These are soft defaults, not hard universal limits:

- Cash ideal: <= 120k miles.
- Cash soft ceiling: around 140k with excellent condition/history.
- Stretch ideal: <= 100k miles.
- Stretch soft ceiling: around 120k miles.

Maintenance history and condition should be capable of outweighing moderate mileage differences.

### Initial walk-away guidance

These should be defaults that can be overridden by search/user configuration:

- Salvage, rebuilt, flood, lemon/buyback, or unresolved odometer discrepancy.
- Non-running vehicle unless a search is explicitly configured for projects.
- Major unresolved safety issue where continued operation is inappropriate.
- Missing VIN when the seller should reasonably be able to provide one.
- Seller refuses independent pre-purchase inspection.
- Title, VIN, mileage, year, make, or model conflicts that cannot be resolved.
- Dealer conditional-price language that makes the real price materially higher than the listing.
- Immediate known repairs materially exceed the search's maintenance reserve.

## Source strategy

Planned source categories include:

- Local independent dealers.
- Large/franchise dealers.
- Dealer-group inventory sites.
- Autotrader and similar aggregators where permitted integrations or alert workflows are available.
- Facebook Marketplace through a compliant assisted/import workflow if no suitable buyer-side API exists.
- Nextdoor, subject to current API/access terms and available marketplace-search capabilities.
- Manual import workflows for sources that are difficult to automate, including pasted URLs, VINs, listing text, or screenshots where supported.

Each source is implemented behind an adapter and classified by access type, such as official API, structured web data, notification import, or browser-assisted workflow.

## Product phases

### Phase 0 — domain definition

- Search configuration schema.
- Model/year knowledge structure.
- Scoring definitions.
- Canonical vehicle/listing model.
- Source adapter contract.
- Extensible attribute/evidence model.

### Phase 1 — useful without a polished UI

- Database schema.
- Manual import and/or one source adapter.
- Listing normalization and deduplication.
- Search evaluator.
- Vehicle Score and Deal Score.
- Ranked JSON/HTML output.
- Basic buyer workflow states and next actions.

### Phase 2 — enrichment and history

- VIN decoding/enrichment.
- Recall lookup.
- Listing snapshots and price history.
- Maintenance/risk knowledge.
- Effective purchase-cost calculation.
- "Why is this cheap?" anomaly flags.
- Inspection guidance and verification questions derived from known risks and missing data.

### Phase 3 — interactive dashboard

- User/search selector.
- Filtering and sorting.
- Listing detail view.
- Favorite/interested/contacted/inspection/rejected workflow.
- Next action and follow-up tracking.
- Rejection reasons.
- Compare candidates.

### Phase 4 — monitoring

- Scheduled collection.
- New-listing and price-drop detection.
- Search-specific notification thresholds.
- Digest/reporting options.

### Phase 5 — assistant access

- MCP server exposing read-oriented tools for saved searches, ranked results, listing details, score explanations, and vehicle/listing history.
- Mutation tools for lightweight workflow updates such as favorite, contacted, inspection, rejected, and rejection reason.
- Authentication and authorization model suitable for a small trusted family deployment.

## Open decisions

- Initial app stack is React + Vite for the dashboard and Hono on Cloudflare Workers for the API/MCP/scheduled server surface.
- D1 schema/ORM choice.
- Authentication approach for a simple family deployment now and public multi-user product later.
- Whether Waku, TanStack Start, RedwoodSDK, Astro, or another lightweight framework later earns adoption for richer routing, SSR, or app-shell needs.
- Exact acquisition approach for each marketplace/aggregator.
- How much historical vehicle-report data can be obtained legally and economically without paid services.
- Monetization model and whether paid data sources become optional premium features.
