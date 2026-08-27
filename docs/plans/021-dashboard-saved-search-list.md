# Plan 021 - Dashboard Saved Search List

## Objective

Make the React dashboard shell useful by loading saved searches and ranked
listings from the existing Worker API.

## Scope

- Fetch saved searches from `/api/searches`.
- Select the first saved search by default.
- Fetch ranked persisted listings for the selected search.
- Render a compact listing table with score, price, mileage, seller, and
  workflow state.
- Keep state local to the React app.

## Deferred

- Client routing.
- Data-cache libraries.
- Listing detail view.
- Workflow mutation controls.
- Authentication UI.
