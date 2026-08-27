# Plan 018 - Dashboard Route Structure

## Objective

Adopt the Cloudflare-first Hono + React/Vite Worker structure for the future
dashboard without switching frameworks or introducing a separate app host.

## Decision

Use one Cloudflare Worker deployment with:

```text
/
  public marketing/info area

/app/*
  auth-protected React dashboard

/api/*
  auth-protected JSON API

/mcp
  auth-protected MCP endpoint
```

For the first family deployment, `/api/*` and `/mcp` can continue using the
existing admin bearer-token boundary until user authentication is added. The
React dashboard should call the JSON API rather than importing server/domain
code directly.

## Rationale

- Cloudflare has an official Hono + React SPA + Vite Worker template.
- Workers Assets can serve the SPA alongside the Hono Worker.
- This preserves the existing Hono Worker/API/MCP work.
- It avoids adding a second hosting target or a larger React framework before
  the dashboard needs one.

## References

- Cloudflare Hono guide: https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/
- Hono Workers + Vite guide: https://hono.dev/docs/getting-started/cloudflare-workers-vite

## Deferred

- Adding React, Vite, and Cloudflare Vite plugin dependencies.
- Implementing real user authentication for `/app/*` and `/api/*`.
- Public marketing copy beyond a minimal placeholder.
- Splitting the repo into a workspace.
