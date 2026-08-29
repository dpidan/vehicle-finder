export const listingDispositionStates = ['new', 'interested', 'favorite', 'contacted', 'inspection', 'rejected', 'sold'] as const;

export type ListingDispositionState = (typeof listingDispositionStates)[number];

export type SortMode = 'deal' | 'vehicle' | 'price' | 'mileage';

export interface SavedSearchSummary {
  id: string;
  name: string;
}

export interface RankedListingSummary {
  listingId: string;
  rankedListing: {
    listing: ListingCandidate;
    scoreVersion: string;
    vehicleScore: number;
    dealScore: number;
    effectiveCost?: EffectiveCostEstimate;
    factors: ScoreFactor[];
    flags: string[];
  };
  disposition: ListingDisposition | null;
}

export interface EffectiveCostEstimate {
  askingPrice: number;
  maintenanceReserve: number;
  maintenanceItems: MaintenanceItemEstimate[];
  maintenanceItemsTotal: number;
  total: number;
}

export interface MaintenanceItemEstimate {
  key: string;
  label: string;
  estimatedCost: number;
  matchedText: string;
}

export interface ScoreFactor {
  key: string;
  messageKey: string;
  messageParams?: Record<string, string | number | boolean>;
  scoreImpact: number;
  evidenceIds?: string[];
}

export interface ListingDisposition {
  id: string;
  savedSearchId: string;
  listingId: string;
  state: ListingDispositionState;
  rejectionReason?: string;
  nextAction?: NextAction;
  updatedAt: string;
}

export type NextActionType =
  | 'request-vin'
  | 'ask-maintenance-records'
  | 'ask-out-the-door-price'
  | 'schedule-inspection'
  | 'follow-up'
  | 'compare'
  | 'none';

export interface NextAction {
  type: NextActionType;
  dueAt?: string;
  note?: string;
}

export interface ListingCandidate {
  source: {
    name: string;
  };
  url: string;
  title: string;
  status?: string;
  vehicle: {
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
  };
  price?: {
    amount: number;
    currency: 'USD';
  };
  mileage?: number;
  exteriorColor?: string;
  photoUrls?: string[];
  titleStatus?: string;
  seller?: {
    name: string;
  };
}

export interface ListingDetail {
  listing: ListingCandidate;
  risks: ModelYearRisk[];
  recallLookup?: RecallLookup;
  snapshots: Array<{
    id: string;
    capturedAt: string;
    price?: ListingCandidate['price'];
    mileage?: number;
    exteriorColor?: string;
    photoUrls?: string[];
  }>;
}

export interface RecallLookup {
  lookupKey: string;
  modelYear: number;
  make: string;
  model: string;
  recalls: RecallRecord[];
  checkedAt: string;
}

export interface RecallRecord {
  campaignNumber?: string;
  component?: string;
  summary?: string;
  consequence?: string;
  remedy?: string;
  reportReceivedDate?: string;
}

export interface DecodeSearchVinsResult {
  searchId: string;
  candidateCount: number;
  decodedCount: number;
  cachedCount: number;
  failed: Array<{
    vin: string;
    error: string;
  }>;
}

export interface RecallLookupResult {
  source: 'cache' | 'live';
  lookup: RecallLookup;
}

export interface SourceFeedSummary {
  id: string;
  name: string;
  adapterKey: string;
  access: string;
  status: 'active' | 'paused' | 'blocked' | 'retired';
  inventoryUrl: string;
  websiteUrl?: string;
  collectionPriority: number;
  lastCollectedAt?: string;
  lastStatus?: string;
  lastError?: string;
  lastCandidateCount?: number;
}

export interface SourceFeedCollectResult {
  collectedAt: string;
  feed: SourceFeedSummary;
  collectedCount: number;
  collectedCountByAdapter: Record<string, number>;
  vinOverlap: {
    withVin: number;
    matchingExistingVehicles: number;
    missingVin: number;
  };
  import?: ManualImportSaveResult['import'];
}

export interface SearchEvaluationWriteResult {
  searchId: string;
  evaluatedAt: string;
  evaluation: ManualImportSaveResult['evaluation'];
}

export interface ModelYearRisk {
  id: string;
  make: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  rating: 'preferred' | 'good' | 'neutral' | 'caution' | 'avoid-unless-remediated';
  issue: string;
  category: string;
  severity: number;
  inspectFor: string[];
}

export interface MonitoringSummary {
  searchId: string;
  since: string;
  staleBefore: string;
  changes: {
    newListings: ListingChangeSummary[];
    priceDrops: ListingChangeSummary[];
  };
  staleListings: StaleListingSummary[];
  thresholdMatches: SearchEvaluationSummary[];
}

export interface ListingChangeSummary {
  listingId: string;
  title: string;
  url: string;
  detectedAt: string;
  currentPrice?: ListingCandidate['price'];
  previousPrice?: ListingCandidate['price'];
}

export interface StaleListingSummary {
  listingId: string;
  title: string;
  url: string;
  lastSeenAt: string;
  price?: ListingCandidate['price'];
}

export interface SearchEvaluationSummary {
  id: string;
  savedSearchId: string;
  listingId: string;
  vehicleId: string;
  scoreVersion: string;
  vehicleScore: number;
  dealScore: number;
  factors: ScoreFactor[];
  flags: string[];
  evaluatedAt: string;
  listing: {
    title: string;
    url: string;
  };
  vehicle: ListingCandidate['vehicle'];
}

export interface ManualImportPreview {
  candidate: ListingCandidate;
  rankedListing: RankedListingSummary['rankedListing'];
}

export type ManualImportInput = Record<string, string | number | string[]>;

export interface ManualImportSaveResult {
  searchId: string;
  importedAt: string;
  import: {
    candidateCount: number;
    insertedListings: number;
    updatedListings: number;
    snapshotCount: number;
  };
  evaluation: {
    insertedEvaluations: number;
  };
}

export interface SearchRefreshResult {
  searchId: string;
  refreshedAt: string;
  source: string;
  feeds?: Array<{ id: string; name: string; adapterKey: string }>;
  collectedCountByAdapter?: Record<string, number>;
  collectedCount: number;
  import: ManualImportSaveResult['import'];
  evaluation: ManualImportSaveResult['evaluation'];
}
