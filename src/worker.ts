import { Hono } from 'hono';
import { getSavedSearch, listSavedSearches, rankSampleListingsForSavedSearch } from './services/search-service.js';
import { manualImportToCandidate, type ManualImportInput } from './sources/manual-import.js';
import { collectSampleListings } from './sources/sample-source.js';
import { rankListingsForSearch } from './scoring/rank-listings.js';

export interface Env {
  DB: D1Database;
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

export default app;
