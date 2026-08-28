# Plan 051 — Saved Search Eligibility Filtering

## Goal

Make saved-search ranking and evaluation respect the search's hard parameters.

## Scope

- Filter ranked listings by configured make, model, year, mileage, seller type, title status, and absolute max price when those facts are known.
- Keep global collection/import broad so one inventory pull can serve multiple saved searches.
- Leave unknown source fields eligible rather than hiding listings because a source omitted title, seats, or other details.

## Result

Refresh still imports broad source inventory, but saved-search evaluations now include only listings that match known hard search parameters. A local refresh on 2026-08-28 collected 49 Dealer Car Search listings and inserted 5 evaluations for the current family search.
