# Search Configuration

## Design goal

Global ingestion should discover and retain a shared pool of vehicles/listings. Saved searches should filter and evaluate that shared inventory differently without duplicating the source data.

## Ownership model

```text
User
  └── SavedSearch[]
        ├── geography
        ├── budget tiers
        ├── hard filters
        ├── vehicle preferences
        ├── optimization goal
        ├── scoring weights
        ├── risk tolerance
        ├── workflow preferences
        └── notification rules
```

Canonical vehicles, listings, sellers, listing snapshots, attribute definitions, evidence records, and model-year knowledge are global.

Saved searches must not assume a specific make/model family. Makes, models, body styles, seating requirements, budget tiers, and preferred tradeoffs are all configuration.

## Proposed configuration shape

Canonical implementation: `src/domain/search-config.ts`.

```ts
interface SavedSearchConfig {
  schemaVersion: 1;
  id: string;
  userId: string;
  name: string;
  enabled: boolean;

  geography: {
    center: {
      label: string;
      latitude: number;
      longitude: number;
    };
    radiusMiles: number;
  };

  budgets: {
    cashTarget?: number;
    stretchTarget?: number;
    absoluteMax?: number;
  };

  filters: {
    makes?: string[];
    models?: string[];
    minYear?: number;
    maxYear?: number;
    maxMileage?: number;
    minSeats?: number;
    titleStatuses?: TitleStatus[];
    sellerTypes?: Array<'dealer' | 'private'>;
    excludeNonRunning?: boolean;
    excludeUnresolvedMajorSafetyIssues?: boolean;
  };

  preferences: {
    optimizationGoal?: 'bestDeal' | 'lowestRisk' | 'fastestPurchase' | 'lowestTotalCost';
    vehicleTypeWeights: Partial<Record<VehicleType, number>>;
    modelPreferences: ModelPreference[];
    mileageTargets?: MileageTargets;
    featurePreferences?: FeaturePreference[];
    preferredInspectionProviderId?: string;
    immediateMaintenanceBudget?: number;
  };

  scoring: {
    vehicleWeights: VehicleScoreWeights;
    dealWeights: DealScoreWeights;
    riskTolerance: 'low' | 'moderate' | 'high';
  };

  notifications: {
    minimumVehicleScore?: number;
    minimumDealScore?: number;
    notifyOnNewListing?: boolean;
    notifyOnPriceDrop?: boolean;
    minimumPriceDrop?: number;
  };

  workflow?: {
    purchaseDeadline?: string;
    willingToTravelBeyondRadius?: boolean;
    privatePartyAllowed?: boolean;
    financingPreference?: 'avoid' | 'acceptable' | 'preferred';
  };
}
```

Runtime validation should reject invalid geographic ranges, impossible year ranges,
misordered budget tiers, invalid score thresholds, preference weights outside
0-1, and Vehicle Score / Deal Score weight sets that do not total 100.

The current schema version is `1`. Persisted saved searches should store this
version so future migrations can update old configuration records deliberately.

## Extensible attributes

The core schema should keep stable first-class columns for facts needed for identity, filtering, indexing, and scoring, such as VIN, year, make, model, trim, mileage, price, seller, title status, location, and source URL.

Less universal facts can be represented as typed attributes attached to vehicles, listings, sellers, or evaluations. Attribute definitions should be portable and versioned enough to allow new facts without schema churn.

Examples:

- `seatingCapacity`
- `bodyStyle`
- `drivetrain`
- `fuelType`
- `hasThirdRow`
- `reportedAccidentCount`
- `ownerCount`
- `serviceHistoryAvailable`
- `dealerDocFee`
- `conditionalPricingDetected`
- `inspectionProviderPreference`

Attribute values should include source/evidence metadata where applicable. Avoid using generic attributes for fields that must be queried constantly or participate in canonical identity.

## Hard filters vs preferences

Use hard filters sparingly. Hard filters remove the listing entirely; preferences influence score.

### Initial family hard exclusions

- Salvage title.
- Rebuilt title.
- Flood title.
- Lemon/buyback title.
- Odometer discrepancy.
- Non-running vehicle.
- Known unresolved major safety issue where continued operation is inappropriate.
- Seller refusal of independent pre-purchase inspection.
- Known immediate repairs above the saved search's maintenance reserve.

### Initial family soft penalties / alerts

- Significant accident history.
- Four or more owners.
- Rental/fleet history.
- Recent auction activity.
- No meaningful maintenance evidence.
- Very short recent ownership.
- Suspiciously low price.
- Known model-year issue without evidence of remediation.
- Missing VIN.
- Dealer conditional-price language.

## Vehicle role fit

Initial family-search defaults:

```text
Minivan:          1.00
Three-row SUV:    0.90
Two-row SUV:      0.70
Sedan:            0.00 (unless search is later broadened)
```

These values belong to the saved search, not the vehicle model itself.

## Initial family defaults

The code-level defaults currently encode:

- Search center: Happy Ln, Cypress, TX.
- Radius: 25 miles, with willingness to consider a wider radius for a much better candidate.
- Budget tiers: $10,000 cash target, $15,000 stretch target, $17,000 absolute max.
- Initial make/model preferences may include Honda Odyssey, Honda Pilot, Toyota Sienna, Honda CR-V, and other reliable/value candidates. These are seed data only, not hard-coded product behavior.
- Third row strongly preferred, not required.
- Purchase deadline: about 3 weeks from August 24, 2026.
- Hard default title status: clean.
- Seller types: dealer and private.
- Private party allowed with inspection.
- Financing acceptable only when the vehicle is materially better.
- Risk tolerance: low.
- Immediate maintenance budget: less than $800.
- Preferred inspection provider: Corb's Auto on Grand Rd. in Cypress, TX.
- Notifications: new listings and price drops, with a $500 minimum price drop.

## Listing disposition

Each user/search can maintain its own interaction state for a listing:

```ts
type ListingDisposition =
  | 'new'
  | 'interested'
  | 'favorite'
  | 'contacted'
  | 'inspection'
  | 'rejected'
  | 'sold';
```

A rejection can include a reason. Rejection reasons may later inform user-specific recommendations, but should not silently change scoring without an explicit product decision.

Listings should also support an optional `nextAction`, such as request VIN, ask for maintenance records, ask for out-the-door price, schedule inspection, follow up, or compare against another candidate.
