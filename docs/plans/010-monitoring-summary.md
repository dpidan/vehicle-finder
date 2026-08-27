# Plan 010 — Monitoring Summary

## Objective

Expose one saved-search-scoped monitoring summary that future dashboard,
digest, or MCP surfaces can read without duplicating alert query logic.

## Scope

- Combine recent listing changes and stale listing warnings.
- Include latest evaluations that meet saved-search notification score
  thresholds.
- Keep the endpoint read-only.

## Deferred

- Persisted notification state.
- Delivery channels.
- Digest formatting.
- Per-user quiet hours and alert preferences.

Add those after the read summary proves useful.
