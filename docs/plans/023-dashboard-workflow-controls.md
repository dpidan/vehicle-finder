# Plan 023 - Dashboard Workflow Controls

## Objective

Let the dashboard update listing workflow state from the ranked listing table.

## Scope

- Add a workflow state selector for each ranked listing.
- Prompt for a rejection reason when setting `rejected`.
- Call the existing `PUT /api/searches/:searchId/listings/:listingId/disposition`
  route.
- Reflect the updated disposition in the local ranked listing state.

## Deferred

- Next-action editing.
- Authentication UI.
- Toast notifications.
- Bulk workflow actions.
