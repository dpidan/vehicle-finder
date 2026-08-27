import type {
  ListingDetail,
  ListingDisposition,
  ListingDispositionState,
  ManualImportInput,
  ManualImportPreview,
  ManualImportSaveResult,
  MonitoringSummary,
  NextAction,
  RankedListingSummary,
  SavedSearchSummary,
  SearchRefreshResult
} from './types.js';

export async function fetchSavedSearches(): Promise<SavedSearchSummary[]> {
  const { searches } = await fetchJson<{ searches: SavedSearchSummary[] }>('/api/searches');
  return searches;
}

export async function fetchRankedListings(searchId: string): Promise<RankedListingSummary[]> {
  const { rankedListings } = await fetchJson<{ rankedListings: RankedListingSummary[] }>(`/api/searches/${searchId}/ranked-listings`);
  return rankedListings;
}

export function fetchListingDetail(listingId: string): Promise<ListingDetail> {
  return fetchJson<ListingDetail>(`/api/listings/${listingId}`);
}

export function fetchMonitoringSummary(searchId: string, window: MonitoringWindow = defaultMonitoringWindow()): Promise<MonitoringSummary> {
  const now = new Date();
  const since = new Date(now.getTime() - window.recentHours * 60 * 60 * 1000).toISOString();
  const staleBefore = new Date(now.getTime() - window.staleDays * 24 * 60 * 60 * 1000).toISOString();
  return fetchJson<MonitoringSummary>(
    `/api/searches/${searchId}/monitoring-summary?since=${encodeURIComponent(since)}&staleBefore=${encodeURIComponent(staleBefore)}`
  );
}

export interface MonitoringWindow {
  recentHours: number;
  staleDays: number;
}

export function defaultMonitoringWindow(): MonitoringWindow {
  return { recentHours: 24, staleDays: 7 };
}

export function previewManualImport(searchId: string, input: ManualImportInput): Promise<ManualImportPreview> {
  return fetchJson<ManualImportPreview>('/api/manual-imports/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ searchId, ...input })
  });
}

export function saveManualImport(searchId: string, input: ManualImportInput, adminToken: string): Promise<ManualImportSaveResult> {
  return fetchJson<ManualImportSaveResult>('/api/admin/manual-imports', {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ searchId, ...input })
  });
}

export function refreshSearch(searchId: string, adminToken: string): Promise<SearchRefreshResult> {
  return fetchJson<SearchRefreshResult>(`/api/admin/searches/${searchId}/refresh`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` }
  });
}

export async function saveListingDisposition(
  searchId: string,
  listingId: string,
  state: ListingDispositionState,
  rejectionReason?: string,
  nextAction?: NextAction
): Promise<ListingDisposition> {
  const { disposition } = await fetchJson<{ disposition: ListingDisposition }>(
    `/api/searches/${searchId}/listings/${listingId}/disposition`,
    {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ state, ...(rejectionReason ? { rejectionReason } : {}), ...(nextAction ? { nextAction } : {}) })
    }
  );
  return disposition;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
