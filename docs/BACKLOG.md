# Backlog

## Now — finish definitions

1. Finalize `SavedSearchConfig` fields and defaults.
2. Define canonical database entities and relationships.
3. Define score-factor data structures and scoring-version behavior.
4. Convert the initial model/year matrix into structured risk records with evidence.
5. Define source-adapter contract and normalized candidate/listing payloads.
6. Define typed attribute/evidence model for extensible facts.
7. Decide initial authentication approach for the first private users while preserving a path to public accounts.

## Done — technical spike

8. Done — scaffold a minimal Cloudflare Worker + Hono + D1 project.
9. Done — define thin domain services behind the Hono routes so API, MCP, and future clients share behavior.
10. Done — add React/Vite after API/database skeleton is working, using regular API calls for data.
11. Done — implement migrations and seed one user + initial family search.
12. Done — build a fake/sample source adapter and fixture dataset.
13. Done — add manual import preview for pasted VIN/URL/listing details.
14. Done — add a repeatable fixture-scoring command before connecting live sources.

## First live data

15. Research local dealer platforms around Cypress, TX.
16. Define a minimal dealer-discovery input: explicit dealer seed list first, center/radius later.
17. Research compliant business/dealer discovery targets for finding franchise and independent dealers within a radius.
18. Pick one structured dealer platform with several nearby dealers.
19. Implement one compliant dealer adapter.
20. Add canonicalization and VIN-based deduplication.
21. Add listing snapshots and price history.

## Enrichment

22. Partial — cached VIN decoding supports admin-triggered single-VIN decode and saved-search VIN enrichment; automatic scheduled enrichment still pending.
23. Partial — cached NHTSA recall lookup by model year/make/model; UI/scoring integration still pending.
24. Partial — structured model/year risk records seeded, shown in listing detail, and used in scoring; evidence weighting still pending.
25. Add estimated immediate-maintenance items.
26. Done — effective-purchase-cost calculation using asking price plus saved-search maintenance reserve.
27. Partial — anomaly / "why is this cheap?" flags include low-price transparency checks; market-comparable pricing still pending.
28. Partial — inspection guidance shown in listing detail; persisted checklist state still pending.

## Dashboard

29. Done — search selector.
30. Done — ranked result list.
31. Done — Vehicle vs Deal Score explanation.
32. Done — listing details, photos, manual-import preview, and save-from-preview.
33. Done — favorites / contacted / inspection / rejected states.
34. Done — next action and follow-up tracking basics.
35. Done — rejection reasons.
36. Done — candidate comparison basics.

## Monitoring

37. Done — scheduled collection.
38. Partial — new-listing signals in API/MCP/dashboard; delivery still pending.
39. Partial — price-drop signals in API/MCP/dashboard; delivery still pending.
40. Partial — score-threshold signals in API/MCP/dashboard; delivery still pending.
41. Partial — stale-listing signals in API/MCP/dashboard; delivery still pending.
42. Partial — plain text digest API/MCP; delivery/scheduling still pending.

## Dashboard operations

48. Done — admin-token-protected saved-search refresh from the dashboard.

## Assistant access

43. Done — define MCP tool surface for saved searches, ranked candidates, listing details, score explanations, and listing history.
44. Done — implement a minimal Streamable-HTTP-shaped `/mcp` endpoint backed by the same domain services as the dashboard/API.
45. Done — implement read-oriented MCP tools.
46. Done — add admin-token-protected mutation tools for workflow state updates.
47. Done — document ChatGPT connection/setup steps for family users.

## Later research

- Nextdoor Display Content API access, marketplace-search capabilities, approval requirements, and limits.
- Facebook Marketplace compliant integration/import options.
- Autotrader/Cars.com/CarGurus permitted alert/API/feed options.
- Dealer-platform adapter reuse opportunities.
- Business-search APIs for automatic dealer discovery within a saved-search radius.
- Optional paid vehicle-history data and whether it provides enough incremental value.
- MCP authentication options on Cloudflare.
- Whether Waku, TanStack Start, RedwoodSDK, Astro, or another lightweight framework becomes useful for richer dashboard needs.
- pnpm workspace transition once multiple independently built apps/packages exist.
- Public-account authentication, authorization, abuse prevention, and rate limits.
- Monetization options and which features, if any, belong behind payment.
- Conservative public-facing risk language and legal disclaimers.
