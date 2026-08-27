# 047 - Dashboard Enrichment Controls

## Goal

Make existing admin-triggered VIN and recall enrichment usable from the dashboard.

## Scope

- Add dashboard actions for saved-search VIN decoding and selected-listing recall lookup.
- Reuse the existing private `ADMIN_TOKEN` prompt pattern.
- Show a concise operation result in the dashboard.
- Refresh listing detail after recall lookup so cached recall notes appear immediately.

## Non-goals

- No new auth flow.
- No automatic scheduled enrichment.
- No recall scoring changes.

## Result

The dashboard can explicitly populate VIN decode cache for the active saved search and recall cache for the selected listing's year/make/model.
