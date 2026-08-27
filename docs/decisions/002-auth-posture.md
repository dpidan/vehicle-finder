# ADR 002 - Authentication Posture

## Status

Accepted for the current private deployment.

## Context

The app currently serves a React dashboard, JSON API routes, admin write routes,
scheduled refresh behavior, and a private MCP endpoint from one Cloudflare
Worker. The first deployment is for trusted family use, while a later public
product may need app-native accounts.

## Options Considered

1. Keep `ADMIN_TOKEN` as a shared bearer token.
2. Put browser routes behind Cloudflare Access.
3. Use Cloudflare Access for humans plus service-token/API-key access for MCP
   and automation.
4. Build app-native auth with sessions, magic links, or passkeys.
5. Add OAuth for MCP.
6. Use a third-party auth provider.

## Decision

Use option 1 for now: a shared `ADMIN_TOKEN` bearer token protects MCP and admin
write routes.

The likely later direction is option 4: app-native auth with private MCP kept
behind an API key until there is a reason to open it up.

## Consequences

- Keep implementation simple while the app is private.
- Treat `ADMIN_TOKEN` as a private API key and rotate it if shared too broadly.
- Do not add user-facing account UX yet.
- Revisit before public deployment, multi-family use, or less-trusted users.
