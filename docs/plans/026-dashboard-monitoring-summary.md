# Plan 026 - Dashboard Monitoring Summary

## Objective

Show recent monitoring signals on the dashboard using the existing monitoring
summary API.

## Scope

- Fetch `/api/searches/:id/monitoring-summary` for the selected search.
- Use a simple 24-hour recent window and 7-day stale cutoff.
- Show counts for new listings, price drops, stale listings, and threshold
  matches.

## Deferred

- User-configurable monitoring windows.
- Digest rendering.
- Notification delivery.
- Linking each monitoring signal to a selected listing.
