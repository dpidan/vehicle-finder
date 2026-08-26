import { Hono } from 'hono';
import type { SavedSearchConfig } from './domain/search-config.js';
import { rankListingsForSearch } from './scoring/rank-listings.js';
import { collectSampleListings } from './sources/sample-source.js';

export interface Env {
  DB: D1Database;
}

interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  enabled: number;
  config_json: string;
  created_at: string;
  updated_at: string;
}

export const app = new Hono<{ Bindings: Env }>();

app.get('/health', (c) => c.json({ ok: true }));

app.get('/api/sample-listings', async (c) =>
  c.json({
    listings: await collectSampleListings(new Date().toISOString())
  })
);

app.get('/api/searches', async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, user_id, name, enabled, config_json, created_at, updated_at
     FROM saved_searches
     ORDER BY name`
  ).all<SavedSearchRow>();

  return c.json({
    searches: results.map(toSavedSearchResponse)
  });
});

app.get('/api/searches/:id', async (c) => {
  const row = await findSavedSearch(c.env.DB, c.req.param('id'));

  if (!row) {
    return c.json({ error: 'not-found' }, 404);
  }

  return c.json({ search: toSavedSearchResponse(row) });
});

app.get('/api/searches/:id/ranked-sample-listings', async (c) => {
  const row = await findSavedSearch(c.env.DB, c.req.param('id'));

  if (!row) {
    return c.json({ error: 'not-found' }, 404);
  }

  const search = JSON.parse(row.config_json) as SavedSearchConfig;
  const listings = await collectSampleListings(new Date().toISOString());

  return c.json({
    searchId: row.id,
    rankedListings: rankListingsForSearch(search, listings)
  });
});

function findSavedSearch(db: D1Database, id: string): Promise<SavedSearchRow | null> {
  return db
    .prepare(
      `SELECT id, user_id, name, enabled, config_json, created_at, updated_at
       FROM saved_searches
       WHERE id = ?`
    )
    .bind(id)
    .first<SavedSearchRow>();
}

function toSavedSearchResponse(row: SavedSearchRow) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    enabled: row.enabled === 1,
    config: JSON.parse(row.config_json) as SavedSearchConfig,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export default app;
