# Plan 020 - React Vite Shell

## Objective

Add the smallest React + Vite dashboard shell that can be served alongside the
existing Hono Worker.

## Scope

- Add React/Vite/Cloudflare Vite plugin dependencies.
- Add Vite config and Worker Assets config.
- Add a minimal `/` public view and `/app/*` dashboard shell.
- Add global CSS tokens and one CSS Module.
- Preserve the existing Worker API, MCP, tests, and D1 bindings.

## Deferred

- Auth-protecting `/app/*`.
- Fetching saved searches or listings.
- Dashboard components beyond the initial shell.
- Base UI, Tailwind, router, or client data-cache libraries.
