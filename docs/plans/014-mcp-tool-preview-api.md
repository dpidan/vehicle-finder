# Plan 014 — MCP Tool Preview API

## Objective

Expose the read-only MCP tool handlers through protected admin HTTP endpoints
so they can be exercised before adding the MCP protocol transport.

## Scope

- List available read-tool metadata.
- Call one read-tool handler with JSON arguments.
- Reuse the existing private admin token.
- Avoid new dependencies and MCP SDK wiring in this chunk.

## Deferred

- Real MCP `/mcp` transport.
- MCP SDK dependency.
- Family-user authentication.
- Public client access.

This lets us validate the tool contract through the Worker while keeping the
actual MCP transport decision separate.
