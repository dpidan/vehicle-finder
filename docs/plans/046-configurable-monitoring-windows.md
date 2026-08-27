# 046 - Configurable Monitoring Windows

## Goal

Let the dashboard user adjust monitoring windows instead of relying on fixed 24-hour and 7-day defaults.

## Scope

- Keep the existing API contract using `since` and `staleBefore`.
- Add dashboard controls for recent-listing hours and stale-listing days.
- Derive ISO timestamps client-side from the selected windows.

## Non-goals

- Do not persist monitoring windows per search yet.
- Do not add notification delivery in this chunk.

## Result

The dashboard now refreshes monitoring summary counts based on user-selected recent and stale windows. Defaults remain 24 hours and 7 days.
