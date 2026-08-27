# Plan 017 - MCP Workflow Mutation Tool

## Objective

Let the protected MCP surface update listing workflow state through the same
domain service as the Worker API.

## Scope

- Add one `set_listing_disposition` MCP tool.
- Require `searchId`, `listingId`, and `state`.
- Support optional `rejectionReason`, `nextActionType`, `nextActionDueAt`, and
  `nextActionNote`.
- Validate search/listing existence before writing.
- Keep the transport stateless and dependency-free.

## Deferred

- Per-user authorization beyond the existing admin-token boundary.
- A separate audit log.
- Multiple state-specific workflow tools.
- Full JSON Schema validation in the MCP transport.
