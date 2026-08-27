# Plan 031 - Manual Import Save

## Objective

Save a manually previewed listing into canonical inventory.

## Scope

- Add an admin-token-protected manual import endpoint.
- Reuse existing manual normalization, inventory import, and evaluation write paths.
- Let the dashboard save the current preview and refresh ranked listings.

## Deferred

- Public-user auth for writes.
- Bulk pasted-listing imports.
- Import conflict review UI.
