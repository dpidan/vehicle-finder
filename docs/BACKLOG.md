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
16. Pick one structured dealer platform with several nearby dealers.
17. Implement one compliant dealer adapter.
18. Add canonicalization and VIN-based deduplication.
19. Add listing snapshots and price history.

## Enrichment

20. Add cached VIN decoding.
21. Add recall lookup where appropriate.
22. Add structured model/year risk rules.
23. Add estimated immediate-maintenance items.
24. Add effective-purchase-cost calculation.
25. Add anomaly / "why is this cheap?" flags.
26. Add inspection guidance and verification questions.

## Dashboard

27. Search selector / user selector.
28. Ranked result list.
29. Vehicle vs Deal Score explanation.
30. Listing details and photos.
31. Favorites / contacted / inspection / rejected states.
32. Next action and follow-up tracking.
33. Rejection reasons.
34. Candidate comparison.

## Monitoring

35. Scheduled collection.
36. New-listing alerts.
37. Price-drop alerts.
38. Score-threshold notifications.
39. Stale-listing alerts.
40. Periodic digest/report.

## Assistant access

41. Define MCP tool surface for saved searches, ranked candidates, listing details, score explanations, and listing history.
42. Implement a Streamable HTTP `/mcp` endpoint backed by the same domain services as the dashboard/API.
43. Implement read-only MCP tools.
44. Add authenticated mutation tools for workflow state updates.
45. Document ChatGPT connection/setup steps for family users.

## Later research

- Nextdoor marketplace API/access details and limits.
- Facebook Marketplace compliant integration/import options.
- Autotrader/Cars.com/CarGurus permitted alert/API/feed options.
- Dealer-platform adapter reuse opportunities.
- Optional paid vehicle-history data and whether it provides enough incremental value.
- MCP authentication options on Cloudflare.
- Whether Waku, TanStack Start, RedwoodSDK, Astro, or another lightweight framework becomes useful for richer dashboard needs.
- pnpm workspace transition once multiple independently built apps/packages exist.
- Public-account authentication, authorization, abuse prevention, and rate limits.
- Monetization options and which features, if any, belong behind payment.
- Conservative public-facing risk language and legal disclaimers.
