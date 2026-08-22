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
        ├── scoring weights
        ├── risk tolerance
        └── notification rules
```

Canonical vehicles, listings, sellers, listing snapshots, and model-year knowledge are global.

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
    vehicleTypeWeights: Partial<Record<VehicleType, number>>;
    modelPreferences: ModelPreference[];
    mileageTargets?: MileageTargets;
    featurePreferences?: FeaturePreference[];
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
}
```

Runtime validation should reject invalid geographic ranges, impossible year ranges,
misordered budget tiers, invalid score thresholds, preference weights outside
0-1, and Vehicle Score / Deal Score weight sets that do not total 100.

The current schema version is `1`. Persisted saved searches should store this
version so future migrations can update old configuration records deliberately.

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

### Initial family soft penalties / alerts

- Significant accident history.
- Four or more owners.
- Rental/fleet history.
- Recent auction activity.
- No meaningful maintenance evidence.
- Very short recent ownership.
- Suspiciously low price.
- Known model-year issue without evidence of remediation.

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

- Search center: Kathy Ln, Cypress, TX.
- Radius: 25 miles.
- Budget tiers: $10,000 cash target, $15,000 stretch target, $17,000 absolute max.
- Makes/models: Honda Odyssey, Honda Pilot, Toyota Sienna, Honda CR-V.
- Hard default title status: clean.
- Seller types: dealer and private.
- Risk tolerance: low.
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
