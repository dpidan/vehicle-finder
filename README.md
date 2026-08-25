# Vehicle Finder

A family-oriented used-vehicle discovery, normalization, scoring, and monitoring tool.

The project is intended to aggregate candidate vehicles from multiple sources, deduplicate them around canonical vehicle/VIN data, enrich listings with reliability and history knowledge, and rank each listing differently for different users and saved searches.

## Current goals

- Support multiple family users and multiple saved searches.
- Search dealers, marketplaces, aggregators, and other permitted sources through independent source adapters.
- Maintain canonical vehicle and listing history rather than treating every source occurrence as a separate vehicle.
- Explain both **Vehicle Score** (how desirable the vehicle is) and **Deal Score** (how attractive the listing is at its current price).
- Track price changes, listing age, seller history, mileage, maintenance evidence, known model-year risks, and estimated immediate costs.
- Make search radius, budgets, model preferences, scoring weights, exclusions, and notifications configurable per saved search.
- Prefer a free or very-low-cost Cloudflare-first deployment if practical.

## Initial family search

- Default search area: 25-mile radius around Kathy Ln, Cypress, Texas.
- Radius must remain configurable.
- Cash target: up to approximately $10,000.
- Stretch/financed target: up to approximately $15,000.
- Primary vehicles: Honda Odyssey, Honda Pilot, Toyota Sienna.
- Secondary candidate: Honda CR-V when a two-row SUV is acceptable.
- Condition, maintenance history, title/accident history, ownership, and model-year reliability should generally matter more than mileage alone.

## Repository map

- `AGENTS.md` — concise instructions and project map for coding agents.
- `docs/PROJECT_PLAN.md` — product scope, goals, phases, and decisions.
- `docs/SEARCH_CONFIGURATION.md` — proposed multi-user/multi-search configuration model.
- `docs/SCORING_MODEL.md` — Vehicle Score and Deal Score definitions.
- `docs/MODEL_YEAR_KNOWLEDGE.md` — initial Honda/Toyota model-year risk matrix.
- `docs/ARCHITECTURE.md` — current technical architecture direction.
- `docs/BACKLOG.md` — ordered implementation backlog.
- `docs/decisions/` — architecture decision records as the design matures.
- `docs/research/` — source-specific research and evidence.
- `docs/plans/` — active implementation plans.
- `migrations/` — D1/SQLite schema migrations.
- `seeds/` — local seed data.

## Local API

```sh
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Initial endpoints:

- `GET /health`
- `GET /api/searches`
- `GET /api/searches/:id`

## Status

Early technical spike. Domain types, the initial D1 schema/seed data, and a minimal Cloudflare Worker + Hono API scaffold exist.
