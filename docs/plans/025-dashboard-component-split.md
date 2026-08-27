# Plan 025 - Dashboard Component Split

## Objective

Split the growing React dashboard file into small local modules before adding
more dashboard features.

## Scope

- Move API helpers and dashboard response types into local files.
- Move listing table, listing detail, metrics, and public home into local
  component files.
- Keep CSS in the existing module for now.
- Preserve dashboard behavior.

## Deferred

- A shared component library.
- A separate styles folder per component.
- Tests for React rendering.
- Router or data-cache extraction.
