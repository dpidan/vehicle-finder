# Backlog

## Now — monitoring operations

1. Done — add configurable monitoring windows instead of fixed dashboard defaults.
2. Add notification delivery for monitoring digests.
3. Improve dashboard digest/report presentation.
4. Done — added admin/dashboard controls for explicit VIN and recall enrichment.
5. Decide whether recall/model-year risk signals should affect scoring now or remain inspection-only.
6. Add persisted inspection checklist state if the manual checklist starts carrying real workflow weight.

## Done — definitions

7. Done — finalized initial `SavedSearchConfig` fields and family defaults.
8. Done — defined canonical database entities and relationships.
9. Done — defined score-factor data structures and scoring-version behavior.
10. Done — converted the initial model/year matrix into structured risk records.
11. Done — defined source-adapter contract and normalized candidate/listing payloads.
12. Done — defined typed attribute/evidence model for extensible facts.
13. Done — decided initial auth approach: private `ADMIN_TOKEN`, with public-account auth deferred.

## Done — technical spike

14. Done — scaffold a minimal Cloudflare Worker + Hono + D1 project.
15. Done — define thin domain services behind the Hono routes so API, MCP, and future clients share behavior.
16. Done — add React/Vite after API/database skeleton is working, using regular API calls for data.
17. Done — implement migrations and seed one user + initial family search.
18. Done — build a fake/sample source adapter and fixture dataset.
19. Done — add manual import preview for pasted VIN/URL/listing details.
20. Done — add a repeatable fixture-scoring command before connecting live sources.

## First live data

21. Done — researched local dealer platforms around Cypress, TX enough to select a first structured source.
22. Done — defined a minimal dealer-discovery input using explicit dealer seed lists.
23. Later — research compliant business/dealer discovery targets for finding franchise and independent dealers within a radius.
24. Done — picked Dealer Car Search as the first structured dealer platform.
25. Done — implemented a compliant Dealer Car Search adapter.
26. Done — added canonicalization and VIN-based deduplication.
27. Done — added listing snapshots and price history.

## Enrichment

28. Partial — cached VIN decoding supports admin-triggered single-VIN decode and saved-search VIN enrichment; automatic scheduled enrichment still pending.
29. Partial — cached NHTSA recall lookup by model year/make/model and listing-detail display; scoring integration still pending.
30. Partial — structured model/year risk records seeded, shown in listing detail, and used in scoring; evidence weighting still pending.
31. Done — estimated immediate-maintenance items parse explicit listing text; richer repair catalog remains later research.
32. Done — effective-purchase-cost calculation using asking price plus saved-search maintenance reserve and explicit maintenance items.
33. Partial — anomaly / "why is this cheap?" flags include low-price transparency checks; market-comparable pricing still pending.
34. Partial — inspection guidance shown in listing detail; persisted checklist state still pending.

## Dashboard

35. Done — search selector.
36. Done — ranked result list.
37. Done — Vehicle vs Deal Score explanation.
38. Done — listing details, photos, manual-import preview, and save-from-preview.
39. Done — favorites / contacted / inspection / rejected states.
40. Done — next action and follow-up tracking basics.
41. Done — rejection reasons.
42. Done — candidate comparison basics.

## Monitoring

43. Done — scheduled collection.
44. Partial — new-listing signals in API/MCP/dashboard with configurable dashboard windows; delivery still pending.
45. Partial — price-drop signals in API/MCP/dashboard with configurable dashboard windows; delivery still pending.
46. Partial — score-threshold signals in API/MCP/dashboard with configurable dashboard windows; delivery still pending.
47. Partial — stale-listing signals in API/MCP/dashboard with configurable dashboard windows; delivery still pending.
48. Partial — plain text digest API/MCP; delivery/scheduling still pending.

## Dashboard operations

49. Done — admin-token-protected saved-search refresh from the dashboard.
50. Done — admin-triggered VIN and recall enrichment API and dashboard controls exist.

## Assistant access

51. Done — define MCP tool surface for saved searches, ranked candidates, listing details, score explanations, and listing history.
52. Done — implement a minimal Streamable-HTTP-shaped `/mcp` endpoint backed by the same domain services as the dashboard/API.
53. Done — implement read-oriented MCP tools.
54. Done — add admin-token-protected mutation tools for workflow state updates.
55. Done — document ChatGPT connection/setup steps for family users.

## Later research

- Nextdoor Display Content API access, marketplace-search capabilities, approval requirements, and limits.
- Facebook Marketplace compliant integration/import options.
- Autotrader/Cars.com/CarGurus permitted alert/API/feed options.
- Dealer-platform adapter reuse opportunities.
- Business-search APIs for automatic dealer discovery within a saved-search radius.
- Optional paid vehicle-history data and whether it provides enough incremental value.
- Richer repair-cost catalog for immediate-maintenance estimates.
- MCP authentication options on Cloudflare.
- Whether Waku, TanStack Start, RedwoodSDK, Astro, or another lightweight framework becomes useful for richer dashboard needs.
- pnpm workspace transition once multiple independently built apps/packages exist.
- Public-account authentication, authorization, abuse prevention, and rate limits.
- Monetization options and which features, if any, belong behind payment.
- Conservative public-facing risk language and legal disclaimers.
