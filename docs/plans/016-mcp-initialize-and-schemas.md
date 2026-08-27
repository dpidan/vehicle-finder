# Plan 016 — MCP Initialize And Schemas

## Objective

Make the minimal MCP HTTP transport easier to exercise with real clients by
adding a basic `initialize` response and input schemas for read-only tools.

## Scope

- Add simple input schema metadata to each MCP read tool definition.
- Return schemas from tool listing endpoints.
- Support a minimal JSON-RPC `initialize` method.
- Keep the transport stateless and dependency-free.

## Deferred

- Official MCP SDK integration.
- Protocol version negotiation beyond a fixed compatibility value.
- Streamable HTTP sessions.
- Resources, prompts, and notifications.

This gives clients enough metadata to discover and call the read tools without
turning the shim into a full MCP server yet.
