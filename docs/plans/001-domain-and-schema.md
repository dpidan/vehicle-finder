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
- Canonical entity relationships are defined in `src/domain/entities.ts` for users, saved searches, vehicles, sellers, listings, snapshots, evaluations, score factors, dispositions, attributes, and evidence records.
- Source adapter contracts, normalized listing candidates, and model-year risk records are defined in `src/domain/entities.ts`.
- Initial D1 schema is implemented in `migrations/0001_initial.sql`.
- Initial family user and saved-search seed data is implemented in `seeds/0001_family_search.sql`.

## Initial D1 Table Proposal

Keep JSON columns for configuration, score factors, flexible attributes, and raw captured text while preserving first-class columns for identity, filtering, joins, and history.

### Core ownership

- `users`: `id`, `email`, `display_name`, `created_at`
- Public-use note: add `locale` before account settings become user-facing beyond the family deployment.
- `saved_searches`: `id`, `user_id`, `name`, `enabled`, `config_json`, `created_at`, `updated_at`

Indexes:

- `saved_searches(user_id, enabled)`

### Shared inventory

- `vehicles`: `id`, `vin`, `year`, `make`, `model`, `trim`, `created_at`, `updated_at`
- `sellers`: `id`, `type`, `name`, `phone`, `website_url`, `latitude`, `longitude`, `location_label`, `created_at`, `updated_at`
- `listings`: `id`, `vehicle_id`, `seller_id`, `source_name`, `source_access`, `source_listing_id`, `url`, `title`, `status`, `price_amount`, `price_currency`, `mileage`, `title_status`, `latitude`, `longitude`, `location_label`, `first_seen_at`, `last_seen_at`, `created_at`, `updated_at`
- `listing_snapshots`: `id`, `listing_id`, `captured_at`, `price_amount`, `price_currency`, `mileage`, `status`, `raw_title`, `raw_description`

Indexes:

- `vehicles(vin)` unique where VIN is present
- `vehicles(make, model, year)`
- `listings(vehicle_id)`
- `listings(seller_id)`
- `listings(source_name, source_listing_id)`
- `listings(status, last_seen_at)`
- `listing_snapshots(listing_id, captured_at)`

### Search-specific scoring and workflow

- `search_evaluations`: `id`, `saved_search_id`, `listing_id`, `vehicle_id`, `score_version`, `vehicle_score`, `deal_score`, `factors_json`, `flags_json`, `evaluated_at`
- `factors_json` and `flags_json` should store stable keys plus interpolation params, not rendered English, so score explanations can be localized at the presentation edge.
- `listing_dispositions`: `id`, `saved_search_id`, `listing_id`, `state`, `rejection_reason`, `next_action_json`, `updated_at`

Indexes:

- `search_evaluations(saved_search_id, deal_score)`
- `search_evaluations(saved_search_id, vehicle_score)`
- `search_evaluations(listing_id)`
- `listing_dispositions(saved_search_id, listing_id)` unique
- `listing_dispositions(saved_search_id, state)`

### Extensible facts and evidence

- `attribute_definitions`: `id`, `key`, `label`, `owner_type`, `value_type`, `version`
- `attribute_values`: `id`, `definition_id`, `owner_type`, `owner_id`, `value_json`, `evidence_ids_json`, `created_at`
- `evidence_records`: `id`, `source_name`, `source_access`, `url`, `label`, `captured_at`, `confidence`
- `model_year_risks`: `id`, `make`, `model`, `year_start`, `year_end`, `rating`, `trim_json`, `engine_json`, `transmission_json`, `issue`, `category`, `severity`, `inspect_for_json`, `remediation_json`, `evidence_ids_json`

Indexes:

- `attribute_definitions(key, owner_type)` unique
- `attribute_values(owner_type, owner_id)`
- `attribute_values(definition_id)`
- `model_year_risks(make, model, year_start, year_end)`
