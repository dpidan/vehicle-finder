# Saved Search Recall Enrichment

## Goal

Populate cached recall lookups for the vehicles currently relevant to a saved search.

## Scope

- Add an admin endpoint that looks up recalls for distinct year/make/model combinations in the latest saved-search evaluations.
- Reuse cached recall records when available.
- Add a dashboard action for bulk saved-search recall lookup while keeping the existing selected-listing recall lookup.

## Deferred

- Recall scoring changes remain separate.
- Scheduled automatic enrichment remains later.

## Result

Done when `/app` can cache recall lookups for the selected saved search without running per-listing actions manually.
