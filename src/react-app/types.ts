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
    factors: ScoreFactor[];
    flags: string[];
  };
  disposition: ListingDisposition | null;
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
  titleStatus?: string;
  seller?: {
    name: string;
  };
}

export interface ListingDetail {
  listing: ListingCandidate;
  snapshots: Array<{
    id: string;
    capturedAt: string;
    price?: ListingCandidate['price'];
    mileage?: number;
  }>;
}

export interface MonitoringSummary {
  searchId: string;
  since: string;
  staleBefore: string;
  changes: {
    newListings: unknown[];
    priceDrops: unknown[];
  };
  staleListings: unknown[];
  thresholdMatches: unknown[];
}

export interface ManualImportPreview {
  candidate: ListingCandidate;
  rankedListing: RankedListingSummary['rankedListing'];
}
