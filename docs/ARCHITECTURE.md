# Architecture Direction

## Current leading approach

A small Cloudflare-first TypeScript application, avoiding a full Next.js stack unless requirements later justify it.

Leading candidate:

```text
Cloudflare Worker
  ├── Hono API
  ├── scheduled collection/orchestration
  └── static application assets

Cloudflare D1
  ├── users / searches
  ├── vehicles
  ├── listings
  ├── listing snapshots
  ├── sellers
  ├── model-year knowledge
  └── search evaluations

React + Vite
  └── small interactive dashboard

Optional later
  ├── Queues for ingestion/enrichment jobs
  └── R2 only if image caching/storage proves worthwhile
```

Astro remains a possible lightweight alternative. A Solid-based frontend is an experimental option, but adopting a new backend/runtime and a new frontend paradigm at the same time is not currently necessary.

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

## Core entities

- User
- SavedSearch
- Vehicle
- Listing
- ListingSnapshot
- Seller
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

## Canonical identification

VIN should be the preferred canonical vehicle identifier when present. Deduplication needs fallbacks for missing VIN listings using normalized make/model/year/trim, seller stock number, mileage, photos, and other signals.

## Hosting constraint

Favor services that remain within free-tier limits for a personal/family workload. Avoid architecture that requires an always-on VM or paid database merely to poll listings periodically.

## Authentication

Multi-user support is intended for a small trusted family group, not a public multi-tenant SaaS. Choose the simplest secure authentication model that works well on Cloudflare. Defer final selection until the UI/backend framework is fixed.
