# Plan 033 - Dashboard Refresh Action

## Objective

Let the dashboard trigger a saved-search refresh.

## Scope

- Add an admin-token-protected dashboard refresh button.
- Reuse the existing `/api/admin/searches/:id/refresh` route.
- Reload ranked listings and monitoring summary after refresh.

## Deferred

- Stored admin sessions.
- Per-user auth/authorization.
- Refresh progress streaming.
