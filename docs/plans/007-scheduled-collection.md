# Plan 007 — Scheduled Collection

## Objective

Run the existing Dealer Car Search collection/import/evaluation path on a
Cloudflare cron trigger so saved searches can stay fresh without a manual API
call.

## Scope

- Configure a low-frequency Worker cron trigger.
- Collect seeded Dealer Car Search listings once per scheduled run.
- Import collected candidates into canonical inventory.
- Write fresh evaluations for enabled saved searches.

## Deferred

- Per-source schedules and backoff.
- Notifications for new listings, price drops, and score thresholds.
- Stale-listing detection.
- Job history/audit tables.
- Queue-based fan-out.

Add those when the first scheduled run is useful and needs operational polish.
