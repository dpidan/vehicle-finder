# Plan 008 — Listing Change Signals

## Objective

Expose recent listing changes from canonical inventory so the dashboard,
digests, or future MCP tools can tell what is new or newly cheaper after
scheduled collection.

## Scope

- List active/pending/unknown listings first seen since a supplied timestamp.
- List price drops detected between the two latest snapshots for a listing.
- Keep the first API read-only and saved-search scoped.

## Deferred

- Persisted alert state.
- User notification delivery.
- Per-user thresholds.
- Mileage-change and status-change alerts.
- Stale-listing detection.

Add those once the raw change feed is useful enough to notify from.
