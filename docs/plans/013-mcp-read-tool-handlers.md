# Plan 013 — MCP Read Tool Handlers

## Objective

Implement the read-only MCP tool handlers as reusable TypeScript functions
before wiring the MCP transport endpoint.

## Scope

- Define a small registry for the initial read-only MCP tool names.
- Dispatch tool calls to existing search and monitoring services.
- Validate required tool arguments at the boundary.
- Keep results structured so a future MCP SDK adapter can wrap them directly.

## Deferred

- MCP protocol endpoint.
- SDK dependency.
- Authentication mechanics.
- Workflow mutations.
- Admin collection/refresh tools.

Add those after the read handlers are reviewed and stable.
