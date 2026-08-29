import { Hono } from 'hono';
import { importListingCandidates } from './services/inventory-service.js';
import { collectActiveSourceFeeds, collectSourceFeed, listSourceFeeds } from './services/source-feed-service.js';
import { filterThresholdMatches, formatMonitoringDigest, isIsoDateTime, type MonitoringSummary } from './services/monitoring-service.js';
import { decodeSavedSearchVins, decodeVin } from './services/vin-decoder-service.js';
import {
  getSavedSearch,
  getListingDetail,
  getListingDisposition,
  listingExists,
  listLatestSearchEvaluations,
  listListingChanges,
  listModelYearRisksForVehicle,
  listSavedSearches,
  listStaleListings,
  rankPersistedListingsForSavedSearch,
  rankSampleListingsForSavedSearch,
  setListingDisposition,
  type ListingDispositionInput,
  writeSearchEvaluations
} from './services/search-service.js';
import { manualImportToCandidate, type ManualImportInput } from './sources/manual-import.js';
import { parseListingCsvImport, parseListingJsonImport } from './sources/listing-import-source.js';
import { handleMcpHttpRequest, parseMcpJsonRequest } from './mcp/http.js';
import { callMcpTool, mcpTools } from './mcp/tools.js';
import { lookupRecalls, lookupRecallsForSavedSearch } from './services/recall-service.js';
import { cypressDealerCarSearchSeeds } from './sources/dealer-car-search-seeds.js';
import { dealerCarSearchSource } from './sources/dealer-car-search-source.js';
import { collectSampleListings } from './sources/sample-source.js';
import { rankListingsForSearch } from './scoring/rank-listings.js';

export interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

export const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => c.json({ ok: true }));

app.get('/app', (c) => serveSpaAsset(c.req.raw, c.env));
app.get('/app/*', (c) => serveSpaAsset(c.req.raw, c.env));

app.post('/mcp', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const body = await parseMcpJsonRequest(c.req.raw);
  return body === 'invalid-json'
    ? Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })
    : handleMcpHttpRequest(c.env.DB, body);
});

app.get('/api/sample-listings', async (c) =>
  c.json({
    listings: await collectSampleListings(new Date().toISOString())
  })
);

app.get('/api/searches', async (c) => {
  return c.json({
    searches: await listSavedSearches(c.env.DB)
  });
});

app.get('/api/searches/:id', async (c) => {
  const search = await getSavedSearch(c.env.DB, c.req.param('id'));

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  return c.json({ search });
});

app.get('/api/searches/:id/ranked-sample-listings', async (c) => {
  const search = await getSavedSearch(c.env.DB, c.req.param('id'));

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  return c.json({
    searchId: search.id,
    rankedListings: await rankSampleListingsForSavedSearch(search, new Date().toISOString())
  });
});

app.get('/api/searches/:id/ranked-listings', async (c) => {
  const search = await getSavedSearch(c.env.DB, c.req.param('id'));

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  return c.json({
    searchId: search.id,
    rankedListings: await rankPersistedListingsForSavedSearch(c.env.DB, search)
  });
});

app.get('/api/searches/:id/evaluations/latest', async (c) => {
  const search = await getSavedSearch(c.env.DB, c.req.param('id'));

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  return c.json({
    searchId: search.id,
    evaluations: await listLatestSearchEvaluations(c.env.DB, search.id)
  });
});

app.get('/api/searches/:id/listing-changes', async (c) => {
  const search = await getSavedSearch(c.env.DB, c.req.param('id'));
  const since = c.req.query('since');

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  if (!isIsoDateTime(since)) {
    return c.json({ error: 'invalid-since' }, 400);
  }

  return c.json({
    searchId: search.id,
    since,
    changes: await listListingChanges(c.env.DB, search.id, since)
  });
});

app.get('/api/searches/:id/stale-listings', async (c) => {
  const search = await getSavedSearch(c.env.DB, c.req.param('id'));
  const before = c.req.query('before');

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  if (!isIsoDateTime(before)) {
    return c.json({ error: 'invalid-before' }, 400);
  }

  return c.json({
    searchId: search.id,
    before,
    staleListings: await listStaleListings(c.env.DB, search.id, before)
  });
});

app.get('/api/searches/:id/monitoring-summary', async (c) => {
  const search = await getSavedSearch(c.env.DB, c.req.param('id'));
  const since = c.req.query('since');
  const staleBefore = c.req.query('staleBefore');

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  if (!isIsoDateTime(since)) {
    return c.json({ error: 'invalid-since' }, 400);
  }

  if (!isIsoDateTime(staleBefore)) {
    return c.json({ error: 'invalid-stale-before' }, 400);
  }

  const [changes, staleListings, evaluations] = await Promise.all([
    listListingChanges(c.env.DB, search.id, since),
    listStaleListings(c.env.DB, search.id, staleBefore),
    listLatestSearchEvaluations(c.env.DB, search.id)
  ]);
  const minimumVehicleScore = search.config.notifications.minimumVehicleScore;
  const minimumDealScore = search.config.notifications.minimumDealScore;

  const summary: MonitoringSummary = {
    searchId: search.id,
    since,
    staleBefore,
    changes,
    staleListings,
    thresholdMatches: filterThresholdMatches(evaluations, minimumVehicleScore, minimumDealScore)
  };

  return c.json(summary);
});

app.get('/api/searches/:id/monitoring-digest', async (c) => {
  const search = await getSavedSearch(c.env.DB, c.req.param('id'));
  const since = c.req.query('since');
  const staleBefore = c.req.query('staleBefore');

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  if (!isIsoDateTime(since)) {
    return c.json({ error: 'invalid-since' }, 400);
  }

  if (!isIsoDateTime(staleBefore)) {
    return c.json({ error: 'invalid-stale-before' }, 400);
  }

  const [changes, staleListings, evaluations] = await Promise.all([
    listListingChanges(c.env.DB, search.id, since),
    listStaleListings(c.env.DB, search.id, staleBefore),
    listLatestSearchEvaluations(c.env.DB, search.id)
  ]);
  const minimumVehicleScore = search.config.notifications.minimumVehicleScore;
  const minimumDealScore = search.config.notifications.minimumDealScore;
  const thresholdMatches = filterThresholdMatches(evaluations, minimumVehicleScore, minimumDealScore);

  return c.text(
    formatMonitoringDigest(search.name, { searchId: search.id, since, staleBefore, changes, staleListings, thresholdMatches }),
    200,
    { 'content-type': 'text/plain; charset=utf-8' }
  );
});

app.get('/api/listings/:id', async (c) => {
  const detail = await getListingDetail(c.env.DB, c.req.param('id'));

  if (!detail) {
    return c.json({ error: 'not-found' }, 404);
  }

  return c.json(detail);
});

app.get('/api/searches/:searchId/listings/:listingId/disposition', async (c) => {
  const disposition = await getListingDisposition(c.env.DB, c.req.param('searchId'), c.req.param('listingId'));
  return c.json({ disposition });
});

app.put('/api/searches/:searchId/listings/:listingId/disposition', async (c) => {
  const searchId = c.req.param('searchId');
  const listingId = c.req.param('listingId');
  const body = (await c.req.json()) as Partial<ListingDispositionInput>;

  if (!isDispositionInput(body)) {
    return c.json({ error: 'invalid-disposition' }, 400);
  }

  const search = await getSavedSearch(c.env.DB, searchId);

  if (!search || !(await listingExists(c.env.DB, listingId))) {
    return c.json({ error: 'not-found' }, 404);
  }

  const disposition = await setListingDisposition(
    c.env.DB,
    searchId,
    listingId,
    body,
    new Date().toISOString()
  );

  return c.json({ disposition });
});

app.post('/api/admin/sources/dealer-car-search/collect', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const collectedAt = new Date().toISOString();
  const candidates = await dealerCarSearchSource.collect({
    sellerSeeds: cypressDealerCarSearchSeeds,
    collectedAt
  });
  const importResult = await importListingCandidates(c.env.DB, candidates);

  return c.json({ collectedAt, source: dealerCarSearchSource.name, collectedCount: candidates.length, import: importResult });
});

app.get('/api/admin/source-feeds', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  return c.json({ feeds: await listSourceFeeds(c.env.DB) });
});

app.post('/api/admin/source-feeds/:id/collect', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const shouldImport = isRecord(body) && body.import === true;
  const searchId = isRecord(body) && typeof body.searchId === 'string' ? body.searchId : undefined;
  const search = searchId ? await getSavedSearch(c.env.DB, searchId) : null;

  if (searchId && !search) {
    return c.json({ error: 'search-not-found' }, 404);
  }

  const collectedAt = new Date().toISOString();
  const sourceRun = await collectSourceFeed(c.env.DB, c.req.param('id'), collectedAt, shouldImport, search ? [search] : []);

  if (!sourceRun) {
    return c.json({ error: 'not-found' }, 404);
  }

  const vinOverlap = await summarizeVinOverlap(c.env.DB, sourceRun.candidates);
  const importResult = shouldImport ? await importListingCandidates(c.env.DB, sourceRun.candidates) : undefined;

  return c.json({
    collectedAt,
    feed: sourceRun.feeds[0],
    collectedCount: sourceRun.candidates.length,
    collectedCountByAdapter: sourceRun.collectedCountByAdapter,
    enrichment: sourceRun.enrichment,
    vinOverlap,
    ...(importResult ? { import: importResult } : {})
  });
});

app.post('/api/admin/searches/:id/evaluations', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const search = await getSavedSearch(c.env.DB, c.req.param('id'));

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  const evaluatedAt = new Date().toISOString();
  const rankedListings = await rankPersistedListingsForSavedSearch(c.env.DB, search);

  return c.json({
    searchId: search.id,
    evaluatedAt,
    evaluation: await writeSearchEvaluations(c.env.DB, search.id, rankedListings, evaluatedAt)
  });
});

app.post('/api/admin/searches/:id/refresh', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const search = await getSavedSearch(c.env.DB, c.req.param('id'));

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  const refreshedAt = new Date().toISOString();
  const sourceRun = await collectActiveSourceFeeds(c.env.DB, refreshedAt, [search]);
  const candidates = sourceRun.candidates;
  const importResult = await importListingCandidates(c.env.DB, candidates);
  const rankedListings = await rankPersistedListingsForSavedSearch(c.env.DB, search);
  const evaluationResult = await writeSearchEvaluations(c.env.DB, search.id, rankedListings, refreshedAt);

  return c.json({
    searchId: search.id,
    refreshedAt,
    source: Object.keys(sourceRun.collectedCountByAdapter).join(', ') || dealerCarSearchSource.name,
    feeds: sourceRun.feeds.map((feed) => ({ id: feed.id, name: feed.name, adapterKey: feed.adapterKey })),
    collectedCountByAdapter: sourceRun.collectedCountByAdapter,
    enrichment: sourceRun.enrichment,
    collectedCount: candidates.length,
    import: importResult,
    evaluation: evaluationResult
  });
});

app.post('/api/admin/vin-decodes', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const body = (await c.req.json()) as { vin?: unknown; modelYear?: unknown };

  if (typeof body.vin !== 'string' || (body.modelYear !== undefined && !isValidModelYear(body.modelYear))) {
    return c.json({ error: 'invalid-vin-decode' }, 400);
  }

  try {
    return c.json(await decodeVin(c.env.DB, body.vin, body.modelYear as number | undefined, new Date().toISOString()));
  } catch (error) {
    return c.json({ error: 'vin-decode-failed', message: errorMessage(error) }, 400);
  }
});

app.post('/api/admin/searches/:id/vin-decodes', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const search = await getSavedSearch(c.env.DB, c.req.param('id'));

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  return c.json(await decodeSavedSearchVins(c.env.DB, search.id, new Date().toISOString()));
});

app.post('/api/admin/searches/:id/recalls', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const search = await getSavedSearch(c.env.DB, c.req.param('id'));

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  return c.json(await lookupRecallsForSavedSearch(c.env.DB, search.id, new Date().toISOString()));
});

app.post('/api/admin/recalls', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const body = (await c.req.json()) as { modelYear?: unknown; make?: unknown; model?: unknown };

  if (!isValidModelYear(body.modelYear) || typeof body.make !== 'string' || typeof body.model !== 'string') {
    return c.json({ error: 'invalid-recall-lookup' }, 400);
  }

  try {
    return c.json(await lookupRecalls(c.env.DB, body.modelYear, body.make, body.model, new Date().toISOString()));
  } catch (error) {
    return c.json({ error: 'recall-lookup-failed', message: errorMessage(error) }, 400);
  }
});

app.get('/api/admin/mcp/tools', (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  return c.json({ tools: mcpTools });
});

app.post('/api/admin/mcp/tools/:name/call', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  let body: unknown = {};
  const text = await c.req.text();

  if (text.trim()) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      return c.json({ error: 'invalid-json' }, 400);
    }
  }

  if (!isRecord(body)) {
    return c.json({ ok: false, error: 'invalid-arguments' }, 400);
  }

  const result = await callMcpTool(c.env.DB, c.req.param('name'), body);
  return c.json(result, result.ok ? 200 : result.error === 'not-found' ? 404 : 400);
});

app.post('/api/manual-imports/preview', async (c) => {
  const body = (await c.req.json()) as ManualImportInput & { searchId?: string };
  let candidate;

  try {
    candidate = manualImportToCandidate(body, new Date().toISOString());
  } catch (error) {
    return c.json({ error: 'invalid-manual-import', message: errorMessage(error) }, 400);
  }

  if (!body.searchId) {
    return c.json({ candidate });
  }

  const search = await getSavedSearch(c.env.DB, body.searchId);

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }
  const risks = await listModelYearRisksForVehicle(c.env.DB, candidate.vehicle.make, candidate.vehicle.model, candidate.vehicle.year);

  return c.json({
    candidate,
    rankedListing: rankListingsForSearch(search.config, [{ ...candidate, risks }])[0]
  });
});

app.post('/api/admin/manual-imports', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const body = (await c.req.json()) as ManualImportInput & { searchId: string };
  const search = await getSavedSearch(c.env.DB, body.searchId);

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  let candidate;
  const importedAt = new Date().toISOString();

  try {
    candidate = manualImportToCandidate(body, importedAt);
  } catch (error) {
    return c.json({ error: 'invalid-manual-import', message: errorMessage(error) }, 400);
  }

  const importResult = await importListingCandidates(c.env.DB, [candidate]);
  const rankedListings = await rankPersistedListingsForSavedSearch(c.env.DB, search);
  const evaluation = await writeSearchEvaluations(c.env.DB, search.id, rankedListings, importedAt);

  return c.json({
    searchId: search.id,
    importedAt,
    import: importResult,
    evaluation
  });
});

app.post('/api/listing-imports/preview', async (c) => {
  const body = (await c.req.json()) as unknown;

  if (!isBulkImportBody(body)) {
    return c.json({ error: 'invalid-listing-import' }, 400);
  }

  const search = await getSavedSearch(c.env.DB, body.searchId);

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  const importedAt = new Date().toISOString();
  const candidates = parseBulkImportCandidates(body, importedAt);
  const rankedListings = await Promise.all(
    candidates.slice(0, 10).map(async (candidate) => {
      const risks = await listModelYearRisksForVehicle(c.env.DB, candidate.vehicle.make, candidate.vehicle.model, candidate.vehicle.year);
      return rankListingsForSearch(search.config, [{ ...candidate, risks }])[0];
    })
  );

  return c.json({ candidateCount: candidates.length, candidates: candidates.slice(0, 10), rankedListings: rankedListings.filter(Boolean) });
});

app.post('/api/admin/listing-imports', async (c) => {
  const unauthorized = requireAdminToken(c.req.raw, c.env.ADMIN_TOKEN);

  if (unauthorized) {
    return c.json({ error: unauthorized }, unauthorized === 'admin-token-not-configured' ? 503 : 401);
  }

  const body = (await c.req.json()) as unknown;

  if (!isBulkImportBody(body)) {
    return c.json({ error: 'invalid-listing-import' }, 400);
  }

  const search = await getSavedSearch(c.env.DB, body.searchId);

  if (!search) {
    return c.json({ error: 'not-found' }, 404);
  }

  const importedAt = new Date().toISOString();
  const candidates = parseBulkImportCandidates(body, importedAt);
  const importResult = await importListingCandidates(c.env.DB, candidates);
  const rankedListings = await rankPersistedListingsForSavedSearch(c.env.DB, search);
  const evaluation = await writeSearchEvaluations(c.env.DB, search.id, rankedListings, importedAt);

  return c.json({ searchId: search.id, importedAt, candidateCount: candidates.length, import: importResult, evaluation });
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid manual import payload.';
}

function isBulkImportBody(value: unknown): value is { searchId: string; format: 'json' | 'csv'; text: string } {
  return (
    isRecord(value) &&
    typeof value.searchId === 'string' &&
    (value.format === 'json' || value.format === 'csv') &&
    typeof value.text === 'string' &&
    value.text.trim().length > 0
  );
}

function parseBulkImportCandidates(body: { format: 'json' | 'csv'; text: string }, importedAt: string) {
  return body.format === 'json' ? parseListingJsonImport(body.text, importedAt) : parseListingCsvImport(body.text, importedAt);
}

function requireAdminToken(request: Request, expected: string | undefined): 'admin-token-not-configured' | 'unauthorized' | undefined {
  if (!expected) {
    return 'admin-token-not-configured';
  }

  return request.headers.get('authorization') === `Bearer ${expected}` ? undefined : 'unauthorized';
}

function isDispositionInput(value: Partial<ListingDispositionInput>): value is ListingDispositionInput {
  const nextAction = value.nextAction;

  return (
    typeof value === 'object' &&
    value !== null &&
    ['new', 'interested', 'favorite', 'contacted', 'inspection', 'rejected', 'sold'].includes(value.state ?? '') &&
    (value.state !== 'rejected' || Boolean(value.rejectionReason)) &&
    (value.state === 'rejected' || value.rejectionReason === undefined) &&
    (value.rejectionReason === undefined || typeof value.rejectionReason === 'string') &&
    (nextAction === undefined ||
      (typeof nextAction === 'object' &&
        nextAction !== null &&
        ['request-vin', 'ask-maintenance-records', 'ask-out-the-door-price', 'schedule-inspection', 'follow-up', 'compare', 'none'].includes(
          nextAction.type
        ) &&
        (nextAction.dueAt === undefined || !Number.isNaN(Date.parse(nextAction.dueAt))) &&
        (nextAction.note === undefined || typeof nextAction.note === 'string')))
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function summarizeVinOverlap(
  db: D1Database,
  candidates: Array<{ vehicle: { vin?: string } }>
): Promise<{ candidatesWithVin: number; existingVinCount: number; newVinCount: number; existingVins: string[]; newVins: string[] }> {
  const vins = Array.from(new Set(candidates.map((candidate) => candidate.vehicle.vin?.toUpperCase()).filter((vin): vin is string => Boolean(vin))));
  const existingVins: string[] = [];

  for (const vin of vins) {
    const existing = await db.prepare(`SELECT vin FROM vehicles WHERE vin = ? LIMIT 1`).bind(vin).first<{ vin: string }>();

    if (existing?.vin) {
      existingVins.push(existing.vin);
    }
  }

  const existingVinSet = new Set(existingVins);
  const newVins = vins.filter((vin) => !existingVinSet.has(vin));

  return {
    candidatesWithVin: vins.length,
    existingVinCount: existingVins.length,
    newVinCount: newVins.length,
    existingVins,
    newVins
  };
}

function isValidModelYear(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1981 && value <= 2100;
}

function serveSpaAsset(request: Request, env: Env): Promise<Response> | Response {
  if (!env.ASSETS) {
    return new Response('Not Found', { status: 404 });
  }

  const url = new URL(request.url);
  url.pathname = '/';
  url.search = '';
  return env.ASSETS.fetch(new Request(url, request));
}

export async function refreshEnabledSavedSearches(db: D1Database, refreshedAt: string): Promise<{
  collectedCount: number;
  imported: Awaited<ReturnType<typeof importListingCandidates>>;
  evaluatedSearches: number;
  insertedEvaluations: number;
}> {
  const searches = (await listSavedSearches(db)).filter((search) => search.enabled);
  const sourceRun = await collectActiveSourceFeeds(db, refreshedAt, searches);
  const candidates = sourceRun.candidates;
  const imported = await importListingCandidates(db, candidates);
  let evaluatedSearches = 0;
  let insertedEvaluations = 0;

  for (const search of searches) {
    const rankedListings = await rankPersistedListingsForSavedSearch(db, search);
    const evaluation = await writeSearchEvaluations(db, search.id, rankedListings, refreshedAt);
    evaluatedSearches += 1;
    insertedEvaluations += evaluation.insertedEvaluations;
  }

  return { collectedCount: candidates.length, imported, evaluatedSearches, insertedEvaluations };
}

export default {
  fetch: app.fetch,
  scheduled: async (controller, env) => {
    await refreshEnabledSavedSearches(env.DB, new Date(controller.scheduledTime).toISOString());
  }
} satisfies ExportedHandler<Env>;
