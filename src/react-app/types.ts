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
    vehicleScore: number;
    dealScore: number;
  };
  disposition: ListingDisposition | null;
}

export interface ListingDisposition {
  id: string;
  savedSearchId: string;
  listingId: string;
  state: ListingDispositionState;
  rejectionReason?: string;
  updatedAt: string;
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
