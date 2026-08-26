# Plan 009 — Stale Listing Signals

## Objective

Expose saved-search-scoped listings that have not been seen recently so the
dashboard, digest, or assistant can flag results that may need verification.

## Scope

- List active/pending/unknown listings last seen before a supplied timestamp.
- Scope stale signals to listings evaluated for the saved search.
- Keep the API read-only.

## Deferred

- Automatic status mutation to `removed`.
- Persisted alert state.
- Source-specific stale thresholds.
- Notification delivery.

Add those once stale candidates need operational follow-up instead of just a
read-time warning.
