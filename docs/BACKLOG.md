# Backlog

## Now — finish definitions

1. Finalize `SavedSearchConfig` fields and defaults.
2. Define canonical database entities and relationships.
3. Define score-factor data structures and scoring-version behavior.
4. Convert the initial model/year matrix into structured risk records with evidence.
5. Define source-adapter contract and normalized candidate/listing payloads.
6. Define typed attribute/evidence model for extensible facts.
7. Decide initial authentication approach for the first private users while preserving a path to public accounts.

## Next — technical spike

8. Scaffold a minimal Cloudflare Worker + Hono + D1 project.
9. Define thin domain services behind the Hono routes so API, MCP, and future clients share behavior.
10. Add React/Vite only after API/database skeleton is working, using regular API calls for data.
11. Implement migrations and seed one user + initial family search.
12. Build a fake/sample source adapter and fixture dataset.
13. Add manual import for pasted VIN/URL/listing details.
14. Run scoring against fixtures before connecting live sources.

## First live data

15. Research local dealer platforms around Cypress, TX.
16. Define a minimal dealer-discovery input: search center/radius plus optional supplied dealer seed list.
17. Research compliant business/dealer discovery targets for finding franchise and independent dealers within a radius.
18. Pick one structured dealer platform with several nearby dealers.
19. Implement one compliant dealer adapter.
20. Add canonicalization and VIN-based deduplication.
21. Add listing snapshots and price history.

## Enrichment

22. Add cached VIN decoding.
23. Add recall lookup where appropriate.
24. Add structured model/year risk rules.
25. Add estimated immediate-maintenance items.
26. Add effective-purchase-cost calculation.
27. Add anomaly / "why is this cheap?" flags.
28. Add inspection guidance and verification questions.

## Dashboard

29. Search selector / user selector.
30. Ranked result list.
31. Vehicle vs Deal Score explanation.
32. Listing details and photos.
33. Favorites / contacted / inspection / rejected states.
34. Next action and follow-up tracking.
35. Rejection reasons.
36. Candidate comparison.

## Monitoring

37. Scheduled collection.
38. New-listing alerts.
39. Price-drop alerts.
40. Score-threshold notifications.
41. Stale-listing alerts.
42. Periodic digest/report.

## Assistant access

43. Define MCP tool surface for saved searches, ranked candidates, listing details, score explanations, and listing history.
44. Implement a Streamable HTTP `/mcp` endpoint backed by the same domain services as the dashboard/API.
45. Implement read-only MCP tools.
46. Add authenticated mutation tools for workflow state updates.
47. Document ChatGPT connection/setup steps for family users.

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
