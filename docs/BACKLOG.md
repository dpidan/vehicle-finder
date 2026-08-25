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
9. Add React/Vite only after API/database skeleton is working.
10. Implement migrations and seed one user + initial family search.
11. Build a fake/sample source adapter and fixture dataset.
12. Add manual import for pasted VIN/URL/listing details.
13. Run scoring against fixtures before connecting live sources.

## First live data

14. Research local dealer platforms around Cypress, TX.
15. Pick one structured dealer platform with several nearby dealers.
16. Implement one compliant dealer adapter.
17. Add canonicalization and VIN-based deduplication.
18. Add listing snapshots and price history.

## Enrichment

19. Add cached VIN decoding.
20. Add recall lookup where appropriate.
21. Add structured model/year risk rules.
22. Add estimated immediate-maintenance items.
23. Add effective-purchase-cost calculation.
24. Add anomaly / "why is this cheap?" flags.
25. Add inspection guidance and verification questions.

## Dashboard

26. Search selector / user selector.
27. Ranked result list.
28. Vehicle vs Deal Score explanation.
29. Listing details and photos.
30. Favorites / contacted / inspection / rejected states.
31. Next action and follow-up tracking.
32. Rejection reasons.
33. Candidate comparison.

## Monitoring

34. Scheduled collection.
35. New-listing alerts.
36. Price-drop alerts.
37. Score-threshold notifications.
38. Stale-listing alerts.
39. Periodic digest/report.

## Assistant access

40. Define MCP tool surface for saved searches, ranked candidates, listing details, score explanations, and listing history.
41. Decide where the MCP server runs in the Cloudflare-first architecture.
42. Implement read-only MCP tools backed by the same domain services as the dashboard/API.
43. Add authenticated mutation tools for workflow state updates.
44. Document ChatGPT connection/setup steps for family users.

## Later research

- Nextdoor marketplace API/access details and limits.
- Facebook Marketplace compliant integration/import options.
- Autotrader/Cars.com/CarGurus permitted alert/API/feed options.
- Dealer-platform adapter reuse opportunities.
- Optional paid vehicle-history data and whether it provides enough incremental value.
- Current MCP hosting/authentication options on Cloudflare.
- pnpm workspace transition once multiple independently built apps/packages exist.
- Public-account authentication, authorization, abuse prevention, and rate limits.
- Monetization options and which features, if any, belong behind payment.
- Conservative public-facing risk language and legal disclaimers.
