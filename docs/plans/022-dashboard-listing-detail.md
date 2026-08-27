# Plan 022 - Dashboard Listing Detail

## Objective

Add a first listing detail panel to the React dashboard using the existing
listing detail API.

## Scope

- Select a listing from ranked results.
- Fetch `/api/listings/:id`.
- Show listing, vehicle, seller, source, status, VIN, price, mileage, and recent
  snapshots.
- Keep selection and data state local to the dashboard.

## Deferred

- URL-backed selected listing state.
- Workflow mutation controls.
- Photo rendering.
- A separate component folder.
