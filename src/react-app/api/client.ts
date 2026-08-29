import type {
  ListingDetail,
  ListingDisposition,
  ListingDispositionState,
  DecodeSearchVinsResult,
  BulkListingImportPreview,
  BulkListingImportSaveResult,
  ManualImportInput,
  ManualImportPreview,
  ManualImportSaveResult,
  MonitoringSummary,
  NextAction,
  RankedListingSummary,
  RecallLookupResult,
  SavedSearchSummary,
  SavedSearchRecallLookupResult,
  SearchEvaluationWriteResult,
  SearchRefreshResult,
  SourceFeedCollectResult,
  SourceFeedStatus,
  SourceFeedSummary
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

export function previewBulkListingImport(searchId: string, format: 'json' | 'csv', text: string): Promise<BulkListingImportPreview> {
  return fetchJson<BulkListingImportPreview>('/api/listing-imports/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ searchId, format, text })
  });
}

export function saveBulkListingImport(
  searchId: string,
  format: 'json' | 'csv',
  text: string,
  adminToken: string
): Promise<BulkListingImportSaveResult> {
  return fetchJson<BulkListingImportSaveResult>('/api/admin/listing-imports', {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ searchId, format, text })
  });
}

export function refreshSearch(searchId: string, adminToken: string): Promise<SearchRefreshResult> {
  return fetchJson<SearchRefreshResult>(`/api/admin/searches/${searchId}/refresh`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` }
  });
}

export function writeSearchEvaluations(searchId: string, adminToken: string): Promise<SearchEvaluationWriteResult> {
  return fetchJson<SearchEvaluationWriteResult>(`/api/admin/searches/${searchId}/evaluations`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` }
  });
}

export async function fetchSourceFeeds(adminToken: string): Promise<SourceFeedSummary[]> {
  const { feeds } = await fetchJson<{ feeds: SourceFeedSummary[] }>('/api/admin/source-feeds', {
    headers: { authorization: `Bearer ${adminToken}` }
  });
  return feeds;
}

export function collectSourceFeed(feedId: string, adminToken: string, shouldImport: boolean): Promise<SourceFeedCollectResult> {
  return fetchJson<SourceFeedCollectResult>(`/api/admin/source-feeds/${feedId}/collect`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ import: shouldImport })
  });
}

export async function updateSourceFeedStatus(feedId: string, status: SourceFeedStatus, adminToken: string): Promise<SourceFeedSummary> {
  const { feed } = await fetchJson<{ feed: SourceFeedSummary }>(`/api/admin/source-feeds/${feedId}/status`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return feed;
}

export function decodeSavedSearchVins(searchId: string, adminToken: string): Promise<DecodeSearchVinsResult> {
  return fetchJson<DecodeSearchVinsResult>(`/api/admin/searches/${searchId}/vin-decodes`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` }
  });
}

export function lookupRecallsForSavedSearch(searchId: string, adminToken: string): Promise<SavedSearchRecallLookupResult> {
  return fetchJson<SavedSearchRecallLookupResult>(`/api/admin/searches/${searchId}/recalls`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` }
  });
}

export function lookupRecallsForVehicle(
  input: { modelYear: number; make: string; model: string },
  adminToken: string
): Promise<RecallLookupResult> {
  return fetchJson<RecallLookupResult>('/api/admin/recalls', {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}`, 'content-type': 'application/json' },
    body: JSON.stringify(input)
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
