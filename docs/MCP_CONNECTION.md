# MCP Connection

This project exposes a minimal, protected MCP-shaped HTTP endpoint at `/mcp`.
It is intended for the private family deployment and currently uses the same
admin bearer token as other protected Worker routes.

Current auth posture: `ADMIN_TOKEN` is a private shared API key for trusted
users and clients. Longer term, the leading direction is app-native auth for the
web app while keeping private MCP/API automation behind an API key until public
MCP access is needed. See `docs/decisions/002-auth-posture.md`.

Official OpenAI documentation describes remote MCP tools as using a server URL,
optional authorization or headers, optional allowed-tool filters, and optional
approval requirements:

- https://platform.openai.com/docs/quickstart/make-your-first-api-request
- https://platform.openai.com/docs/api-reference/responses

## Local Setup

Run the Worker with a local D1 database:

```sh
npm run db:migrate:local
npm run db:seed:local
ADMIN_TOKEN=dev-secret npm run dev
```

The local MCP URL is:

```text
http://localhost:8787/mcp
```

Use this authorization header:

```text
Authorization: Bearer dev-secret
```

## Smoke Test

Initialize the endpoint:

```sh
curl -s http://localhost:8787/mcp \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer dev-secret' \
  -d '{"jsonrpc":"2.0","id":"init","method":"initialize"}'
```

List tools:

```sh
curl -s http://localhost:8787/mcp \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer dev-secret' \
  -d '{"jsonrpc":"2.0","id":"tools","method":"tools/list"}'
```

Call a read tool. On a freshly seeded database this may return an empty list
until listings have been collected or imported:

```sh
curl -s http://localhost:8787/mcp \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer dev-secret' \
  -d '{"jsonrpc":"2.0","id":"ranked","method":"tools/call","params":{"name":"get_ranked_listings","arguments":{"searchId":"family-replacement-vehicle"}}}'
```

Call the workflow mutation tool after listings exist. Replace
`<listing-id-from-ranked-results>` with a `listingId` returned by
`get_ranked_listings`:

```sh
curl -s http://localhost:8787/mcp \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer dev-secret' \
  -d '{"jsonrpc":"2.0","id":"workflow","method":"tools/call","params":{"name":"set_listing_disposition","arguments":{"searchId":"family-replacement-vehicle","listingId":"<listing-id-from-ranked-results>","state":"favorite","nextActionType":"ask-out-the-door-price"}}}'
```

## Remote Deployment

Set the production token as a Worker secret:

```sh
wrangler secret put ADMIN_TOKEN
```

Apply migrations and seed data to the remote D1 database before connecting a
client:

```sh
wrangler d1 migrations apply vehicle-finder --remote
wrangler d1 execute vehicle-finder --remote --file seeds/0001_family_search.sql
```

After deployment, the remote MCP URL is:

```text
https://<worker-host>/mcp
```

Configure the client with:

- server URL: `https://<worker-host>/mcp`
- header: `Authorization: Bearer <ADMIN_TOKEN>`
- approvals: require approval for `set_listing_disposition`

## Current Tools

- `list_saved_searches`
- `get_saved_search`
- `get_ranked_listings`
- `get_listing_detail`
- `get_listing_snapshots`
- `get_latest_evaluations`
- `get_listing_disposition`
- `get_monitoring_summary`
- `get_monitoring_digest`
- `set_listing_disposition`

## Current Limits

- The endpoint is a minimal JSON-RPC HTTP transport, not the official MCP SDK.
- Auth is a single shared admin token/private API key.
- There is no per-user authorization or separate audit log yet.
- The mutation tool should require human approval in any client that supports
  approval policies.
