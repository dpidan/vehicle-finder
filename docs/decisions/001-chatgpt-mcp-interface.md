# ADR 001 — ChatGPT MCP Interface

## Status

Accepted.

## Context

The vehicle finder is intended for a small family search workflow where conversational access can be useful for asking questions like "what changed today?", "why is this listing ranked highly?", and "mark this one rejected because of accident history." The core system already needs saved searches, ranked candidates, listing details, explainable score factors, listing history, and per-search workflow state.

Adding ChatGPT access should not create a second implementation of search, scoring, authorization, or workflow behavior.

## Decision

Expose a future MCP interface as a thin adapter over the same domain services and API behavior used by the dashboard.

Initial MCP scope:

- Read saved searches available to the authenticated family user.
- Read ranked candidates for a saved search.
- Read listing and canonical vehicle details with source attribution.
- Explain Vehicle Score, Deal Score, risk flags, and major score factors.
- Read listing history, including first seen, last seen, price changes, and mileage changes.
- Later, update workflow state such as favorite, contacted, inspection, rejected, and rejection reason.

Read-only tools should come before mutation tools. Mutation tools require clear authentication, authorization, and audit behavior.

## Consequences

- Domain services must remain UI-agnostic so dashboard routes and MCP tools can share behavior.
- Search evaluation, score explanation, and listing workflow state need stable internal contracts before MCP is implemented.
- The database schema should support per-user or per-search listing disposition independently of source listings and canonical vehicles.
- MCP hosting and authentication details remain open until the Cloudflare Worker scaffold and family authentication approach are selected.
