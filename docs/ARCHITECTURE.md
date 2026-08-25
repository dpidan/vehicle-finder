# Architecture Direction

## Current approach

A small Cloudflare-first TypeScript application, avoiding a full Next.js stack unless requirements later justify it. The first deployment can be personal/family scale, but the architecture should not block a later public multi-user product.

Initial stack:

```text
Cloudflare Worker
  ├── Hono API
  ├── MCP interface for ChatGPT access
  ├── scheduled collection/orchestration
  └── static application assets

Cloudflare D1
  ├── users / searches
  ├── vehicles
  ├── listings
  ├── listing snapshots
  ├── sellers
  ├── attribute definitions / values
  ├── evidence records
  ├── model-year knowledge
  └── search evaluations

React + Vite
  └── small interactive dashboard

ChatGPT / MCP client
  └── saved search and listing tools backed by the same domain APIs

Optional later
  ├── Queues for ingestion/enrichment jobs
  └── R2 only if image caching/storage proves worthwhile
```

React + Vite is the initial dashboard choice because React is ubiquitous and keeps the UI easy to staff, search, and replace later if needed. The dashboard should fetch data through regular API calls rather than depending on React Server Components or server actions as the main data boundary. This preserves a clean contract for future clients such as MCP tools, scripts, or a companion mobile app.

Hono is the initial server framework because it is lightweight, TypeScript-friendly, built on web-standard `Request`/`Response`, and portable across Cloudflare Workers, Node.js, Bun, Deno, and other compatible hosts. Hono routes should stay thin and delegate durable behavior to domain services that can also back MCP and non-Worker collectors.

Waku, TanStack Start, RedwoodSDK, Astro, and similar frameworks remain revisit candidates if the dashboard grows enough to need richer routing, SSR, streaming, or framework-managed React integration. Avoid making React Server Components or server actions the core data model unless a later product requirement clearly justifies that tradeoff.

## Repository shape

Keep the initial implementation as a single TypeScript package until there are at least two independently built or deployed targets. A pnpm workspace may become useful once shared domain/scoring code is consumed by separate apps or runners, such as:

- a Cloudflare Worker API/MCP service;
- a React/Vite dashboard;
- source collectors that run outside Cloudflare;
- reusable adapter, enrichment, fixture, or database packages.

Likely future shape:

```text
apps/
  worker/
  web/
  mcp/        # only if it cannot stay inside the Worker

packages/
  domain/
  scoring/
  sources/
  db/
  fixtures/
```

Do not introduce monorepo structure only to prepare for possible future split points. Revisit when the dashboard, MCP interface, or non-Worker collector creates real package boundaries.

## Domain separation

```text
Canonical Vehicle
      │
      ├── Listing A (dealer)
      ├── Listing B (aggregator)
      └── Listing C (marketplace)
              │
              └── ListingSnapshot[]

Saved Search A ──> Evaluation A
Saved Search B ──> Evaluation B
```

Facts about a vehicle/listing are global. Preferences and scores are search-specific.

Make/model affinity, body-style fit, buyer urgency, financing posture, maintenance budget, travel flexibility, and risk tolerance belong to saved-search configuration. They should not leak into canonical vehicle/listing records.

## MCP interface

The system should eventually expose an MCP server so ChatGPT can act as a conversational interface for the family vehicle search. The MCP layer should be a thin adapter over the same domain/API services used by the dashboard, not a separate implementation of search or scoring logic.

Prefer the official TypeScript MCP SDK when implementation begins. A remote deployment should favor Streamable HTTP at `/mcp`, with a stateless implementation unless session state becomes necessary.

Initial MCP tools should focus on:

- Listing saved searches available to the authenticated user.
- Returning ranked candidates for a saved search.
- Fetching listing and vehicle details, including source links and attribution.
- Explaining Vehicle Score, Deal Score, risk flags, and major score factors.
- Showing listing history such as first seen, last seen, price changes, and mileage changes.
- Updating user workflow state such as favorite, contacted, inspection, rejected, and rejection reason.

MCP access should respect the same family-user authorization boundaries as the dashboard. Prefer read-only tools first, then add mutations once authentication and audit behavior are clear.

## Core entities

- User
- SavedSearch
- Vehicle
- Listing
- ListingSnapshot
- Seller
- AttributeDefinition
- AttributeValue
- EvidenceRecord
- VehicleAssessment / model-year knowledge
- SearchEvaluation
- ScoreFactor
- ListingDisposition

## Source adapter concept

```ts
interface ListingSource {
  name: string;
  collect(context: CollectionContext): Promise<ListingCandidate[]>;
}
```

The rest of the system must not care whether a collector runs in a Worker, GitHub Action, local machine, or another compatible runner.

Suggested source-access classifications:

```ts
type SourceAccess =
  | 'official-api'
  | 'structured-web'
  | 'notification-import'
  | 'browser-assisted';
```

Do not make full browser automation a prerequisite for the core architecture.

Manual import should be treated as a source-access path, not a throwaway shortcut. Pasted URLs, VINs, listing text, and source-specific notes should normalize through the same candidate/listing contracts as automated adapters.

## Extensibility

Use first-class schema fields for durable, frequently queried facts and a typed attribute/evidence layer for facts that vary by source, vehicle category, or future enrichment provider.

The attribute layer should support:

- stable keys and value types;
- ownership by vehicle, listing, seller, or evaluation;
- source attribution and confidence;
- versioning or migration when definitions change;
- promotion of heavily used attributes into first-class columns later.

This keeps the model portable without turning core identity and ranking fields into unqueryable blobs.

## Canonical identification

VIN should be the preferred canonical vehicle identifier when present. Deduplication needs fallbacks for missing VIN listings using normalized make/model/year/trim, seller stock number, mileage, photos, and other signals.

## Hosting constraint

Favor services that remain within free-tier limits for a personal/family workload. Avoid architecture that requires an always-on VM or paid database merely to poll listings periodically.

## Authentication

Multi-user support starts as a small trusted family group, but should not paint the project into a corner for public accounts later. Choose the simplest secure authentication model that works well on Cloudflare while preserving clear ownership boundaries for users, saved searches, workflow state, and any future paid features.

## Internationalization posture

The system should be i18n-ready without carrying a full translation workflow before there is a public UI.

Persist stable domain codes, numbers, dates, money amounts, and message keys. Render user-facing language at the UI/API edge using the authenticated user's locale. Avoid storing generated English labels in durable records when a code plus parameters can describe the same fact.

Examples:

- Store title status as `clean`, not "Clean title".
- Store next actions as `request-vin`, not "Ask seller for the VIN".
- Store score factors as `key`, `messageKey`, `messageParams`, and numeric impact, not a pre-rendered sentence.
- Preserve imported seller/listing text, source titles, evidence labels, and user-entered notes in their original language because they are source evidence or user content, not product copy.

Default locale can remain `en-US` for the family deployment. Add a translation catalog only when the dashboard or MCP responses need a second supported locale.
