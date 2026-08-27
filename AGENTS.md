# Vehicle Finder — Agent Instructions

## Project purpose

Build a small, explainable used-vehicle discovery and ranking system for a family. The system supports multiple users and saved searches while sharing global vehicle/listing ingestion, normalization, enrichment, and history.

## Sources of truth

Read these before making architectural or domain-model changes:

1. `docs/PROJECT_PLAN.md`
2. `docs/SEARCH_CONFIGURATION.md`
3. `docs/SCORING_MODEL.md`
4. `docs/MODEL_YEAR_KNOWLEDGE.md`
5. `docs/ARCHITECTURE.md`
6. `docs/BACKLOG.md`

Keep durable decisions in files instead of relying on chat context.

## Engineering principles

- Prefer simple, low-cost infrastructure.
- Current leading deployment direction is Cloudflare-first.
- Keep collectors behind adapters so a difficult source can run outside Cloudflare without changing the domain model.
- Separate canonical vehicle facts from source listings and from search-specific evaluations.
- Keep model/year risk knowledge in data, not conditional application code.
- Scores must be explainable through individual factors.
- Avoid scraping approaches that violate source terms or depend on bypassing anti-bot protections.
- Preserve source attribution/evidence for reliability rules and enrichment claims.
- Prefer TypeScript unless a documented decision changes this.
- Avoid unnecessary dependencies, especially on large frameworks or libraries. Ask permission for those first. 
- Use the Ponytail skill for code generation and refactoring, but review and test all generated code before committing.

## Working style

Before implementing a substantial feature, update or create a plan under `docs/plans/` if the behavior is not already well specified. When a decision materially changes architecture, add a short ADR under `docs/decisions/` and update the relevant source-of-truth document.

## Responses

When responding to a request, if it is not clear or already part of the plan, first confirm your understanding of the request. If you need more information, ask clarifying questions. Avoid making assumptions about the user's intent.

When a self-encompassed change is complete:
- do a quick code review of your changes
- provide a short summary of the change and what the new work does as well as a recommended Git commit message.
- do the commit with a clear message and push it to the main branch unless direction, a decision, feedback or input is needed. 