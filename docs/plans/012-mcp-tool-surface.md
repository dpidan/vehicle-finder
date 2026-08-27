# Plan 012 — MCP Tool Surface

## Objective

Define the first ChatGPT MCP tools over the existing Worker/domain services so
assistant access can be implemented without inventing a second vehicle-search
API.

## Scope

- Start with read-only tools backed by existing saved-search, listing,
  evaluation, workflow, and monitoring services.
- Read workflow state through MCP now; defer workflow mutations until
  authentication and audit behavior are decided.
- Keep tool names stable, explicit, and saved-search scoped where user
  preferences affect results.
- Defer SDK wiring until the contract is reviewed.

## Initial Tools

### `list_saved_searches`

List saved searches visible to the authenticated family user.

Backs onto:

- `listSavedSearches`
- `GET /api/searches`

Returns:

- `id`
- `name`
- `enabled`
- key notification thresholds

### `get_saved_search`

Fetch one saved search and its configuration.

Backs onto:

- `getSavedSearch`
- `GET /api/searches/:id`

Input:

- `searchId`

### `get_ranked_listings`

Return ranked persisted listings for a saved search, including current
workflow disposition.

Backs onto:

- `rankPersistedListingsForSavedSearch`
- `GET /api/searches/:id/ranked-listings`

Input:

- `searchId`

### `get_listing_detail`

Fetch canonical listing detail and recent snapshot history, including current
price/mileage and recent price movement evidence.

Backs onto:

- `getListingDetail`
- `GET /api/listings/:id`

Input:

- `listingId`

### `get_listing_snapshots`

Fetch recent listing snapshots when a client wants history without the full
listing detail payload.

Backs onto:

- `getListingDetail`
- `GET /api/listings/:id`

Input:

- `listingId`

### `get_latest_evaluations`

Return the latest persisted evaluation for each listing in a saved search.

Backs onto:

- `listLatestSearchEvaluations`
- `GET /api/searches/:id/evaluations/latest`

Input:

- `searchId`

### `get_listing_disposition`

Read workflow state for one listing within one saved search.

Backs onto:

- `getListingDisposition`
- `GET /api/searches/:searchId/listings/:listingId/disposition`

Input:

- `searchId`
- `listingId`

### `get_monitoring_summary`

Return recent new listings, price drops, stale listings, and score-threshold
matches for one saved search.

Backs onto:

- `listListingChanges`
- `listStaleListings`
- `listLatestSearchEvaluations`
- `GET /api/searches/:id/monitoring-summary`

Input:

- `searchId`
- `since`
- `staleBefore`

### `get_monitoring_digest`

Return the current plain-text monitoring digest as a convenience view. The
structured summary remains the primary MCP monitoring tool.

Backs onto:

- `GET /api/searches/:id/monitoring-digest`

Input:

- `searchId`
- `since`
- `staleBefore`

## Deferred

- MCP SDK dependency and endpoint wiring.
- Authentication mechanics; tools should still use the same family-user
  authorization boundary as the dashboard/API.
- Mutation tools for workflow updates.
- Admin collection or refresh tools.
- Streaming responses.
- MCP resources and prompts.

Add those after the read-only tool contract is reviewed.
