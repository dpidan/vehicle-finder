import type { ListingCandidate, ListingDispositionState, RankedListingSummary, SortMode } from '../api/types.js';

export function bestScore(listings: RankedListingSummary[], key: 'dealScore' | 'vehicleScore'): string {
  return listings.length ? Math.max(...listings.map((listing) => listing.rankedListing[key])).toString() : '0';
}

export function filterAndSortListings(
  listings: RankedListingSummary[],
  stateFilter: ListingDispositionState | 'all',
  sortMode: SortMode
): RankedListingSummary[] {
  return [...listings]
    .filter((listing) => stateFilter === 'all' || (listing.disposition?.state ?? 'new') === stateFilter)
    .sort((a, b) => sortListing(a, b, sortMode));
}

export function statusLabel(status: 'loading' | 'ready' | 'empty' | 'error'): string {
  return status === 'loading' ? 'Loading' : status === 'error' ? 'Error' : status === 'empty' ? 'No searches' : 'Ready';
}

export function emptyTitle(status: 'loading' | 'ready' | 'empty' | 'error'): string {
  return status === 'loading' ? 'Loading listings.' : status === 'error' ? 'Could not load dashboard data.' : 'No ranked listings yet.';
}

export function emptyMessage(status: 'loading' | 'ready' | 'empty' | 'error'): string {
  return status === 'loading'
    ? 'Fetching saved searches and rankings from the Worker API.'
    : status === 'error'
      ? 'Check that the local database is migrated and seeded, then refresh.'
      : 'Collect or import listings, then run a search refresh to create ranked results.';
}

export function vehicleLabel(vehicle: ListingCandidate['vehicle']): string {
  return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ') || 'Unknown vehicle';
}

export function formatMoney(price: ListingCandidate['price']): string {
  return price ? new Intl.NumberFormat('en-US', { style: 'currency', currency: price.currency, maximumFractionDigits: 0 }).format(price.amount) : 'Unknown';
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function detailEmptyTitle(status: 'idle' | 'loading' | 'ready' | 'error'): string {
  return status === 'loading' ? 'Loading detail.' : status === 'error' ? 'Could not load listing.' : 'Select a listing.';
}

export function detailEmptyMessage(status: 'idle' | 'loading' | 'ready' | 'error'): string {
  return status === 'loading'
    ? 'Fetching detail and snapshots from the Worker API.'
    : status === 'error'
      ? 'The listing may no longer exist in the local database.'
      : 'Choose a row from ranked listings to inspect source and history details.';
}

function sortListing(a: RankedListingSummary, b: RankedListingSummary, sortMode: SortMode): number {
  if (sortMode === 'vehicle') {
    return b.rankedListing.vehicleScore - a.rankedListing.vehicleScore;
  }

  if (sortMode === 'price') {
    return (a.rankedListing.listing.price?.amount ?? Number.MAX_SAFE_INTEGER) - (b.rankedListing.listing.price?.amount ?? Number.MAX_SAFE_INTEGER);
  }

  if (sortMode === 'mileage') {
    return (a.rankedListing.listing.mileage ?? Number.MAX_SAFE_INTEGER) - (b.rankedListing.listing.mileage ?? Number.MAX_SAFE_INTEGER);
  }

  return b.rankedListing.dealScore - a.rankedListing.dealScore;
}
