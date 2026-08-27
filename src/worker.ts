import { Hono } from 'hono';
import { importListingCandidates } from './services/inventory-service.js';
import {
  getSavedSearch,
  getListingDetail,
  getListingDisposition,
  listingExists,
  listLatestSearchEvaluations,
  listListingChanges,
  listSavedSearches,
  listStaleListings,
  rankPersistedListingsForSavedSearch,
  rankSampleListingsForSavedSearch,
  setListingDisposition,
  type ListingChanges,
  type ListingDispositionInput,
  type SearchEvaluationSummary,
  type StaleListingSummary,
  writeSearchEvaluations
} from './services/search-service.js';
import { manualImportToCandidate, type ManualImportInput } from './sources/manual-import.js';
import { cypressDealerCarSearchSeeds } from './sources/dealer-car-search-seeds.js';
import { dealerCarSearchSource } from './sources/dealer-car-search-source.js';
import { collectSampleListings } from './sources/sample-source.js';
import { rankListingsForSearch } from './scoring/rank-listings.js';

export interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
}

export const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => c.json({ ok: true }));

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

  return c.json({
    searchId: search.id,
    since,
    staleBefore,
    changes,
    staleListings,
    thresholdMatches: filterThresholdMatches(evaluations, minimumVehicleScore, minimumDealScore)
  });
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
    formatMonitoringDigest(search.name, since, staleBefore, changes, staleListings, thresholdMatches),
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
  const candidates = await dealerCarSearchSource.collect({
    sellerSeeds: cypressDealerCarSearchSeeds,
    collectedAt: refreshedAt
  });
  const importResult = await importListingCandidates(c.env.DB, candidates);
  const rankedListings = await rankPersistedListingsForSavedSearch(c.env.DB, search);
  const evaluationResult = await writeSearchEvaluations(c.env.DB, search.id, rankedListings, refreshedAt);

  return c.json({
    searchId: search.id,
    refreshedAt,
    source: dealerCarSearchSource.name,
    collectedCount: candidates.length,
    import: importResult,
    evaluation: evaluationResult
  });
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

  return c.json({
    candidate,
    rankedListing: rankListingsForSearch(search.config, [candidate])[0]
  });
});

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid manual import payload.';
}

function requireAdminToken(request: Request, expected: string | undefined): 'admin-token-not-configured' | 'unauthorized' | undefined {
  if (!expected) {
    return 'admin-token-not-configured';
  }

  return request.headers.get('authorization') === `Bearer ${expected}` ? undefined : 'unauthorized';
}

function isIsoDateTime(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function filterThresholdMatches(
  evaluations: SearchEvaluationSummary[],
  minimumVehicleScore: number | undefined,
  minimumDealScore: number | undefined
): SearchEvaluationSummary[] {
  return minimumVehicleScore === undefined && minimumDealScore === undefined
    ? []
    : evaluations.filter(
        (evaluation) =>
          (minimumVehicleScore === undefined || evaluation.vehicleScore >= minimumVehicleScore) &&
          (minimumDealScore === undefined || evaluation.dealScore >= minimumDealScore)
      );
}

function formatMonitoringDigest(
  searchName: string,
  since: string,
  staleBefore: string,
  changes: ListingChanges,
  staleListings: StaleListingSummary[],
  thresholdMatches: SearchEvaluationSummary[]
): string {
  const lines = [
    `${searchName} monitoring digest`,
    `Window since: ${since}`,
    `Stale before: ${staleBefore}`,
    '',
    `New listings: ${changes.newListings.length}`,
    ...changes.newListings.map((listing) => `- ${listing.title} ${formatPrice(listing.currentPrice)} ${listing.url}`.trim()),
    '',
    `Price drops: ${changes.priceDrops.length}`,
    ...changes.priceDrops.map((listing) =>
      `- ${listing.title} ${formatPrice(listing.previousPrice)} -> ${formatPrice(listing.currentPrice)} ${listing.url}`.trim()
    ),
    '',
    `Stale listings: ${staleListings.length}`,
    ...staleListings.map((listing) => `- ${listing.title} last seen ${listing.lastSeenAt} ${listing.url}`),
    '',
    `Score threshold matches: ${thresholdMatches.length}`,
    ...thresholdMatches.map(
      (evaluation) =>
        `- ${evaluation.listing.title} vehicle ${evaluation.vehicleScore}, deal ${evaluation.dealScore} ${evaluation.listing.url}`
    )
  ];

  return `${lines.join('\n')}\n`;
}

function formatPrice(price: { amount: number; currency: 'USD' } | undefined): string {
  return price ? `$${price.amount.toLocaleString('en-US')}` : 'unknown price';
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

export async function refreshEnabledSavedSearches(db: D1Database, refreshedAt: string): Promise<{
  collectedCount: number;
  imported: Awaited<ReturnType<typeof importListingCandidates>>;
  evaluatedSearches: number;
  insertedEvaluations: number;
}> {
  const candidates = await dealerCarSearchSource.collect({
    sellerSeeds: cypressDealerCarSearchSeeds,
    collectedAt: refreshedAt
  });
  const imported = await importListingCandidates(db, candidates);
  let evaluatedSearches = 0;
  let insertedEvaluations = 0;

  for (const search of await listSavedSearches(db)) {
    if (!search.enabled) {
      continue;
    }

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
