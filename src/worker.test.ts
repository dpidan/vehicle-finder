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

  it('returns ranked persisted listings for a saved search', async () => {
    const response = await app.request('/api/searches/family-replacement-vehicle/ranked-listings', {}, env({ persistedListings: true }));
    const body = (await response.json()) as { rankedListings: Array<{ listing: { title: string }; dealScore: number }> };

    assert.equal(response.status, 200);
    assert.equal(body.rankedListings[0]?.listing.title, '2015 Toyota Sienna XLE');
    assert.ok(body.rankedListings[0]?.dealScore);
  });

  it('returns 404 for persisted ranking with a missing saved search', async () => {
    const response = await app.request('/api/searches/missing/ranked-listings', {}, env({ persistedListings: true }));

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'not-found' });
  });

  it('requires a configured admin token for dealer collection', async () => {
    const response = await app.request('/api/admin/sources/dealer-car-search/collect', { method: 'POST' }, env());

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'admin-token-not-configured' });
  });

  it('rejects dealer collection without the admin token', async () => {
    const response = await app.request('/api/admin/sources/dealer-car-search/collect', { method: 'POST' }, env({ adminToken: 'secret' }));

    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'unauthorized' });
  });

  it('collects and imports Dealer Car Search listings with the admin token', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
      new Response(
        `
          <div>
            <a>2013 Honda Odyssey</a>
            <span>$7,890</span>
            <span>Mileage:</span><span>163,707</span>
            <span>VIN: 5FNRL5H95DB028656</span>
          </div>
        `
      );

    try {
      const response = await app.request(
        '/api/admin/sources/dealer-car-search/collect',
        { method: 'POST', headers: { authorization: 'Bearer secret' } },
        env({ adminToken: 'secret' })
      );
      const body = (await response.json()) as {
        collectedCount: number;
        import: { candidateCount: number; insertedListings: number; snapshotCount: number };
      };

      assert.equal(response.status, 200);
      assert.equal(body.collectedCount, 1);
      assert.equal(body.import.candidateCount, 1);
      assert.equal(body.import.insertedListings, 1);
      assert.equal(body.import.snapshotCount, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
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

function env(options: { adminToken?: string; persistedListings?: boolean } = {}): Env {
  return {
    ...(options.adminToken ? { ADMIN_TOKEN: options.adminToken } : {}),
    DB: {
      prepare: (sql: string) => ({
        bind: (id: string) => ({
          first: async () => (id === savedSearchRow.id ? savedSearchRow : null),
          run: async () => ({ success: true })
        }),
        all: async () => ({
          results: sql.includes('FROM saved_searches')
            ? [savedSearchRow]
            : options.persistedListings && sql.includes('FROM listings') && sql.includes("WHERE listings.status IN ('active', 'pending', 'unknown')")
              ? [persistedListingRow, betterPersistedListingRow]
              : []
        })
      })
    } as unknown as D1Database
  };
}

const persistedListingRow = {
  id: 'listing-odyssey',
  source_name: 'dealer car search seeded dealer',
  source_access: 'structured-web',
  source_listing_id: '5FNRL5H95DB028656',
  url: 'https://www.tradelanemotors.com/newandusedcars?clearall=1',
  title: '2013 Honda Odyssey',
  status: 'active',
  price_amount: 7890,
  price_currency: 'USD',
  mileage: 163707,
  title_status: 'clean',
  listing_latitude: null,
  listing_longitude: null,
  listing_location_label: null,
  last_seen_at: '2026-08-26T12:00:00.000Z',
  vin: '5FNRL5H95DB028656',
  year: 2013,
  make: 'Honda',
  model: 'Odyssey',
  trim: null,
  seller_name: 'Trade Lane Motors',
  seller_type: 'dealer',
  seller_phone: null,
  seller_website_url: 'https://www.tradelanemotors.com',
  seller_latitude: null,
  seller_longitude: null,
  seller_location_label: null
};

const betterPersistedListingRow = {
  ...persistedListingRow,
  id: 'listing-sienna',
  source_listing_id: '5TDYK3DC0FS000001',
  title: '2015 Toyota Sienna XLE',
  price_amount: 9900,
  mileage: 93000,
  vin: '5TDYK3DC0FS000001',
  year: 2015,
  make: 'Toyota',
  model: 'Sienna',
  seller_phone: '555-0100'
};
