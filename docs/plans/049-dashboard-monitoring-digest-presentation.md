# 049 - Dashboard Monitoring Digest Presentation

## Goal

Make the dashboard monitoring summary useful with real local data, not just count cards.

## Scope

- Keep the existing monitoring summary API.
- Type the dashboard monitoring payload.
- Show compact sections for new listings, price drops, score threshold matches, and stale listings.
- Keep each section capped so the dashboard stays scannable.

## Non-goals

- No notification delivery.
- No new monitoring endpoint.
- No charting or table library.

## Result

The monitoring panel now shows the top items behind each signal count, with source links and the key price/score/date context needed for quick review.
