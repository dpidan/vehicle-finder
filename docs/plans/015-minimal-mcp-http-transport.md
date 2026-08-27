# Plan 015 — Minimal MCP HTTP Transport

## Objective

Expose the read-only MCP tool handlers through a minimal protected `/mcp`
HTTP endpoint before adopting the official MCP SDK.

## Scope

- Accept simple JSON-RPC 2.0 requests for `tools/list` and `tools/call`.
- Return JSON-RPC response envelopes.
- Reuse the existing read-only MCP tool registry and dispatcher.
- Protect the endpoint with the current private admin token.

## Deferred

- Official MCP SDK integration.
- Streamable HTTP session behavior.
- Public/family authentication.
- Mutation tools.
- Resources and prompts.

This gives us a testable transport-shaped endpoint while keeping the real MCP
SDK decision isolated.
