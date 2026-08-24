# Plan 001 — Domain and Schema Definition

## Objective

Reach a stable enough domain model to scaffold D1 without baking search preferences, make/model assumptions, reliability assumptions, or first-user defaults into the wrong layer.

## Deliverables

- Final `SavedSearchConfig` definition. Initial implementation: `src/domain/search-config.ts`.
- Entity relationship model for User, SavedSearch, Vehicle, Listing, ListingSnapshot, Seller, SearchEvaluation, ScoreFactor, ListingDisposition, and next-action workflow state.
- Structured model-year knowledge schema.
- Source adapter and normalized listing contracts.
- Typed attribute/evidence model for extensible facts.
- Initial D1 table proposal and indexes.
- Domain service boundaries that can later support both dashboard routes and MCP tools.

## Acceptance criteria

- One canonical listing can be scored differently by multiple searches.
- One physical VIN can appear on multiple source listings without becoming multiple vehicles.
- Price history is reconstructable from snapshots.
- Score results are versioned and explainable.
- Model-year rules can be edited as data without application-condition changes.
- No source-specific payload leaks into the core domain model.
- Initial Honda/Toyota family-search defaults are seed configuration only, not product assumptions.
- New attributes and enrichment facts can be attached with source attribution without changing the canonical vehicle identity model.
- Listing disposition is stored per saved search or user/search context, not on the global listing record.
- Listings can carry next-action workflow state for urgent buyer use.
- Ranked results, score explanations, listing details, and listing history can be exposed through an API or MCP adapter without duplicating scoring logic.

## Progress

- `SavedSearchConfig` v1 has TypeScript types, initial family defaults, and lightweight validation for ranges, budget ordering, score thresholds, preference weights, and scoring weight totals.
