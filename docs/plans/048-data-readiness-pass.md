# 048 - Data Readiness Pass

## Goal

Make the first local and Worker D1 population repeatable and inspectable before testing live data.

## Scope

- Audit the seed data shape for the first family search.
- Make the initial seed safe to re-run for its fixed rows.
- Document local and remote migration, seed, refresh, and inspection flow.
- Add simple DB inspection SQL for row counts and relationship spot checks.
- Add focused tests for seed/source readiness and migration ordering.
- Sync backlog and README notes for the current Dealer Car Search live source.

## Non-goals

- No new migration framework.
- No destructive local reset script.
- No new live source adapter.

## Result

The project now has a small first-run checklist and inspection command set for validating local data before moving the same migration/seed flow to Worker D1.
