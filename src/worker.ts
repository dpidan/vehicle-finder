import { Hono } from 'hono';
import { importListingCandidates } from './services/inventory-service.js';
import {
  getSavedSearch,
  listSavedSearches,
  rankPersistedListingsForSavedSearch,
  rankSampleListingsForSavedSearch
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

export default app;
