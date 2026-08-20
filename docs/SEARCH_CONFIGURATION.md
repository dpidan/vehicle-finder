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

```ts
interface SavedSearchConfig {
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
    titleStatuses?: string[];
    sellerTypes?: Array<'dealer' | 'private'>;
  };

  preferences: {
    vehicleTypeWeights: Record<string, number>;
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
