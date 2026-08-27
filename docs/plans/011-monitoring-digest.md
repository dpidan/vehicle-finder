# Plan 011 — Monitoring Digest

## Objective

Expose a simple saved-search monitoring digest that can be read manually now
and reused by future notification delivery later.

## Scope

- Return a text digest for one saved search and monitoring window.
- Include new listings, price drops, stale listings, and score-threshold
  matches.
- Keep the endpoint read-only and delivery-free.

## Deferred

- Email, SMS, or push delivery.
- Persisted digest history.
- HTML formatting.
- User quiet hours.

Add those only after the plain digest content is useful.
