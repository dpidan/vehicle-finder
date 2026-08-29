# Dashboard Source Feed Controls

## Goal

Let the dashboard operator run a single configured source feed without running a full saved-search refresh.

## Scope

- Add dashboard controls to preview a feed collection without importing.
- Add dashboard controls to import a selected active feed.
- Show the last feed action result, including collected candidates, VIN overlap, and import counts.
- Refresh source-feed status after every action, then rewrite selected-search evaluations and refresh dashboard listings/monitoring after imports.

## Deferred

- Notification delivery is pushed later.
- Editing feed status, priority, URLs, or adapter metadata remains a future admin workflow.

## Result

Done when source feeds can be loaded, previewed, and imported from `/app` using the existing admin token.
