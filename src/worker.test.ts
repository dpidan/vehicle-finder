import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { familySearchDefaults } from './domain/search-config.js';
import { app, type Env } from './worker.js';

const savedSearchRow = {
  id: 'family-replacement-vehicle',
  user_id: 'family',
  name: 'Family replacement vehicle',
  enabled: 1,
  config_json: JSON.stringify(familySearchDefaults),
  created_at: '2026-08-25T00:00:00.000Z',
  updated_at: '2026-08-25T00:00:00.000Z'
};

describe('worker routes', () => {
  it('reports health', async () => {
    const response = await app.request('/health', {}, env());

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });

  it('lists saved searches', async () => {
    const response = await app.request('/api/searches', {}, env());
    const body = (await response.json()) as { searches: Array<{ id: string; enabled: boolean }> };
    const firstSearch = body.searches[0];

    assert.equal(response.status, 200);
    assert.ok(firstSearch);
    assert.equal(firstSearch.id, 'family-replacement-vehicle');
    assert.equal(firstSearch.enabled, true);
  });

  it('returns sample listings', async () => {
    const response = await app.request('/api/sample-listings', {}, env());
    const body = (await response.json()) as { listings: Array<{ title: string }> };

    assert.equal(response.status, 200);
    assert.equal(body.listings.length, 3);
    assert.equal(body.listings[0]?.title, '2016 Honda Odyssey EX-L');
  });

  it('returns ranked sample listings for a saved search', async () => {
    const response = await app.request('/api/searches/family-replacement-vehicle/ranked-sample-listings', {}, env());
    const body = (await response.json()) as { rankedListings: Array<{ dealScore: number; factors: unknown[] }> };
    const first = body.rankedListings[0];

    assert.equal(response.status, 200);
    assert.ok(first);
    assert.ok(first.dealScore > 0);
    assert.ok(first.factors.length > 0);
  });

  it('returns a saved search by id', async () => {
    const response = await app.request('/api/searches/family-replacement-vehicle', {}, env());
    const body = (await response.json()) as { search: { config: { userId: string } } };

    assert.equal(response.status, 200);
    assert.equal(body.search.config.userId, 'family');
  });

  it('previews a manual import against a saved search', async () => {
    const response = await app.request(
      '/api/manual-imports/preview',
      {
        method: 'POST',
        body: JSON.stringify({
          searchId: 'family-replacement-vehicle',
          url: 'https://example.test/manual-sienna',
          title: '2015 Toyota Sienna XLE',
          year: 2015,
          make: 'Toyota',
          model: 'Sienna',
          price: 14900,
          mileage: 93000,
          titleStatus: 'clean',
          description: 'Maintenance records available.'
        }),
        headers: { 'content-type': 'application/json' }
      },
      env()
    );
    const body = (await response.json()) as { rankedListing: { listing: { title: string }; dealScore: number } };

    assert.equal(response.status, 200);
    assert.equal(body.rankedListing.listing.title, '2015 Toyota Sienna XLE');
    assert.ok(body.rankedListing.dealScore > 0);
  });

  it('rejects invalid manual import preview payloads', async () => {
    const response = await app.request(
      '/api/manual-imports/preview',
      {
        method: 'POST',
        body: JSON.stringify({ url: '', title: 'Missing URL' }),
        headers: { 'content-type': 'application/json' }
      },
      env()
    );

    assert.equal(response.status, 400);
  });

  it('returns 404 for a missing saved search', async () => {
    const response = await app.request('/api/searches/missing', {}, env());

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'not-found' });
  });
});

function env(): Env {
  return {
    DB: {
      prepare: (sql: string) => ({
        bind: (id: string) => ({
          first: async () => (id === savedSearchRow.id ? savedSearchRow : null)
        }),
        all: async () => ({
          results: sql.includes('FROM saved_searches') ? [savedSearchRow] : []
        })
      })
    } as unknown as D1Database
  };
}
