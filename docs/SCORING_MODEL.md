# Scoring Model

## Principle

Maintain two independent 0-100 scores:

- **Vehicle Score** — how desirable this specific physical vehicle appears for this saved search.
- **Deal Score** — how attractive this particular listing/opportunity is at its current price and circumstances.

The same listing can receive different scores for different saved searches. Scoring must remain generic: make/model preferences, risk tolerance, budget preference, financing preference, and optimization goal are saved-search inputs.

## Initial Vehicle Score weights — family search

| Factor | Weight |
|---|---:|
| Reliability / model-year risk | 25 |
| Maintenance / service history | 20 |
| Mileage relative to age | 15 |
| Title / accident / ownership history | 15 |
| Mechanical / physical condition | 10 |
| Family / vehicle-role fit | 10 |
| Trim / useful features | 5 |
| **Total** | **100** |

Mileage is intentionally not dominant. A well-maintained higher-mileage vehicle should be able to outrank a lower-mileage vehicle with poor history.

## Initial Deal Score weights — family search

| Factor | Weight |
|---|---:|
| Price vs comparable listings | 30 |
| Effective purchase cost | 20 |
| Vehicle Score contribution | 20 |
| Price vs saved-search budget | 10 |
| Listing age / price movement | 8 |
| Seller confidence | 5 |
| Distance | 4 |
| Listing completeness / transparency | 3 |
| **Total** | **100** |

## Effective purchase cost

Where data is available:

```text
effectivePurchaseCost =
  askingPrice
  + estimatedImmediateMaintenance
  + knownRepairs
  + mandatoryDealerFees
```

Taxes/registration, financing costs, insurance deltas, and travel costs can be tracked separately or included in a broader total-cost view when enough data is available.

For the initial family search, known immediate repairs should be treated seriously when they exceed the configured maintenance reserve of less than $800.

## Explainability

Every computed score should persist its factors, for example:

```text
Deal Score: 92

+ excellent maintenance evidence
+ favorable mileage for age
+ below comparable market price
+ preferred model/year
+ one-owner history
- minor accident reported
- tires likely approaching replacement
```

A stored evaluation should include a `scoreVersion` so scoring-model changes can be traced and inventory can be recomputed.

Public-facing explanations should be conservative and evidence-based. Prefer wording such as "missing data", "verify before purchase", "listed price may exclude conditions", or "inspection recommended" rather than claims about seller intent or definitive mechanical condition.

## Optimization profiles

Saved searches can choose or approximate different optimization goals using weights:

- Best deal: emphasizes price versus comparable listings, price movement, and effective purchase cost.
- Lowest risk: emphasizes title/history, maintenance evidence, reliability knowledge, inspection results, and seller transparency.
- Fastest purchase: emphasizes listing freshness, seller responsiveness, distance, inspection availability, and workflow readiness.
- Lowest long-term ownership cost: emphasizes reliability, maintenance milestones, fuel/insurance estimates, and expected repairs.

These are profiles over the same scoring factors, not separate scoring systems.

## Model-year preference levels

Global model-year knowledge should express risk; a saved search controls how heavily that risk affects ranking.

Suggested descriptive levels:

- Preferred
- Good
- Neutral
- Caution
- Avoid unless documented/remediated

These should not be encoded as irreversible verdicts. Evidence of a documented repair can materially reduce an issue penalty.

## Anomaly flags

Scoring should be supplemented with explicit flags such as:

- New listing.
- Price drop.
- Large price drop.
- Under-market candidate.
- Low mileage for age.
- Suspiciously low price.
- Missing VIN.
- Inconsistent VIN/listing attributes.
- Potential dealer conditional-price language.
- Likely near-term major maintenance.
- Seller refusal of independent inspection.
- Immediate repairs above saved-search maintenance reserve.
- Stale listing or uncertain availability.
