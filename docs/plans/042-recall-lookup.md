# 042 - Recall Lookup

## Goal

Add a cached recall lookup using NHTSA's public recalls API.

## Scope

- Cache recall results by model year, make, and model.
- Add an admin-protected route for explicit recall lookup.
- Store the raw recall records so later UI/scoring can decide how to present them.

## Non-goals

- Do not claim VIN-specific open/remedied recall status.
- Do not score recalls yet.
- Do not run recall lookup automatically during scheduled refresh.

## Notes

NHTSA's public recall endpoint accepts model year, make, and model. Results should be shown as recalls that may apply to that vehicle configuration and need verification by VIN/service records.
