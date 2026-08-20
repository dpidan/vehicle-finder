# Backlog

## Now — finish definitions

1. Finalize `SavedSearchConfig` fields and defaults.
2. Define canonical database entities and relationships.
3. Define score-factor data structures and scoring-version behavior.
4. Convert the initial model/year matrix into structured risk records with evidence.
5. Define source-adapter contract and normalized candidate/listing payloads.
6. Decide initial authentication approach for family users.

## Next — technical spike

7. Scaffold a minimal Cloudflare Worker + Hono + D1 project.
8. Add React/Vite only after API/database skeleton is working.
9. Implement migrations and seed one user + initial family search.
10. Build a fake/sample source adapter and fixture dataset.
11. Run scoring against fixtures before connecting live sources.

## First live data

12. Research local dealer platforms around Cypress, TX.
13. Pick one structured dealer platform with several nearby dealers.
14. Implement one compliant dealer adapter.
15. Add canonicalization and VIN-based deduplication.
16. Add listing snapshots and price history.

## Enrichment

17. Add cached VIN decoding.
18. Add recall lookup where appropriate.
19. Add structured model/year risk rules.
20. Add estimated immediate-maintenance items.
21. Add effective-purchase-cost calculation.
22. Add anomaly / "why is this cheap?" flags.

## Dashboard

23. Search selector / user selector.
24. Ranked result list.
25. Vehicle vs Deal Score explanation.
26. Listing details and photos.
27. Favorites / contacted / inspection / rejected states.
28. Rejection reasons.
29. Candidate comparison.

## Monitoring

30. Scheduled collection.
31. New-listing alerts.
32. Price-drop alerts.
33. Score-threshold notifications.
34. Periodic digest/report.

## Later research

- Nextdoor marketplace API/access details and limits.
- Facebook Marketplace compliant integration/import options.
- Autotrader/Cars.com/CarGurus permitted alert/API/feed options.
- Dealer-platform adapter reuse opportunities.
- Optional paid vehicle-history data and whether it provides enough incremental value.
