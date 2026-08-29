import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { familySearchDefaults } from './domain/search-config.js';
import { cypressDealerCarSearchSeeds } from './sources/dealer-car-search-seeds.js';
import { app, refreshEnabledSavedSearches, type Env } from './worker.js';

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

  it('serves the dashboard route from assets', async () => {
    const assetRequests: string[] = [];
    const response = await app.request('/app/listings', {}, env({ assetRequests }));

    assert.equal(response.status, 200);
    assert.equal(await response.text(), '<html>dashboard</html>');
    assert.equal(new URL(assetRequests[0] ?? '').pathname, '/');
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
    const body = (await response.json()) as {
      rankedListings: Array<{
        listingId: string;
        rankedListing: { listing: { title: string }; dealScore: number };
        disposition: { state: string } | null;
      }>;
    };

    assert.equal(response.status, 200);
    assert.equal(body.rankedListings[0]?.listingId, 'listing-sienna');
    assert.equal(body.rankedListings[0]?.rankedListing.listing.title, '2015 Toyota Sienna XLE');
    assert.equal(body.rankedListings[0]?.disposition?.state, 'favorite');
    assert.equal(body.rankedListings[1]?.disposition, null);
    assert.ok(body.rankedListings[0]?.rankedListing.dealScore);
  });

  it('returns 404 for persisted ranking with a missing saved search', async () => {
    const response = await app.request('/api/searches/missing/ranked-listings', {}, env({ persistedListings: true }));

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'not-found' });
  });

  it('returns latest persisted search evaluations', async () => {
    const response = await app.request('/api/searches/family-replacement-vehicle/evaluations/latest', {}, env({ evaluations: true }));
    const body = (await response.json()) as {
      evaluations: Array<{
        listingId: string;
        dealScore: number;
        factors: Array<{ key: string }>;
        flags: string[];
        listing: { title: string };
        vehicle: { make: string };
      }>;
    };

    assert.equal(response.status, 200);
    assert.equal(body.evaluations[0]?.listingId, 'listing-sienna');
    assert.equal(body.evaluations[0]?.dealScore, 91);
    assert.equal(body.evaluations[0]?.factors[0]?.key, 'budget-fit');
    assert.deepEqual(body.evaluations[0]?.flags, ['missing-maintenance-evidence']);
    assert.equal(body.evaluations[0]?.listing.title, '2015 Toyota Sienna XLE');
    assert.equal(body.evaluations[0]?.vehicle.make, 'Toyota');
  });

  it('returns 404 for latest evaluations with a missing saved search', async () => {
    const response = await app.request('/api/searches/missing/evaluations/latest', {}, env({ evaluations: true }));

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'not-found' });
  });

  it('returns recent listing change signals for a saved search', async () => {
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/listing-changes?since=2026-08-26T12:00:00.000Z',
      {},
      env({ listingChanges: true })
    );
    const body = (await response.json()) as {
      changes: {
        newListings: Array<{ listingId: string }>;
        priceDrops: Array<{ listingId: string; currentPrice?: { amount: number }; previousPrice?: { amount: number } }>;
      };
    };

    assert.equal(response.status, 200);
    assert.equal(body.changes.priceDrops[0]?.listingId, 'listing-sienna');
    assert.equal(body.changes.priceDrops[0]?.currentPrice?.amount, 9900);
    assert.equal(body.changes.priceDrops[0]?.previousPrice?.amount, 10900);
    assert.equal(body.changes.newListings[0]?.listingId, 'listing-odyssey');
  });

  it('validates listing change requests', async () => {
    const missingSince = await app.request(
      '/api/searches/family-replacement-vehicle/listing-changes',
      {},
      env({ listingChanges: true })
    );
    const invalidSince = await app.request(
      '/api/searches/family-replacement-vehicle/listing-changes?since=not-a-date',
      {},
      env({ listingChanges: true })
    );
    const missingSearch = await app.request(
      '/api/searches/missing/listing-changes?since=2026-08-26T12:00:00.000Z',
      {},
      env({ listingChanges: true })
    );

    assert.equal(missingSince.status, 400);
    assert.deepEqual(await missingSince.json(), { error: 'invalid-since' });
    assert.equal(invalidSince.status, 400);
    assert.deepEqual(await invalidSince.json(), { error: 'invalid-since' });
    assert.equal(missingSearch.status, 404);
    assert.deepEqual(await missingSearch.json(), { error: 'not-found' });
  });

  it('returns stale listings for a saved search', async () => {
    const db = env({ staleListings: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/stale-listings?before=2026-08-26T12:00:00.000Z',
      {},
      { DB: db }
    );
    const body = (await response.json()) as {
      staleListings: Array<{ listingId: string; lastSeenAt: string; price?: { amount: number } }>;
    };

    assert.equal(response.status, 200);
    assert.equal(body.staleListings[0]?.listingId, 'listing-odyssey');
    assert.equal(body.staleListings[0]?.lastSeenAt, '2026-08-25T12:00:00.000Z');
    assert.equal(body.staleListings[0]?.price?.amount, 7890);
    assert.equal(db.writes.length, 0);
  });

  it('validates stale listing requests', async () => {
    const missingBefore = await app.request(
      '/api/searches/family-replacement-vehicle/stale-listings',
      {},
      env({ staleListings: true })
    );
    const invalidBefore = await app.request(
      '/api/searches/family-replacement-vehicle/stale-listings?before=not-a-date',
      {},
      env({ staleListings: true })
    );
    const missingSearch = await app.request(
      '/api/searches/missing/stale-listings?before=2026-08-26T12:00:00.000Z',
      {},
      env({ staleListings: true })
    );

    assert.equal(missingBefore.status, 400);
    assert.deepEqual(await missingBefore.json(), { error: 'invalid-before' });
    assert.equal(invalidBefore.status, 400);
    assert.deepEqual(await invalidBefore.json(), { error: 'invalid-before' });
    assert.equal(missingSearch.status, 404);
    assert.deepEqual(await missingSearch.json(), { error: 'not-found' });
  });

  it('returns a monitoring summary for a saved search', async () => {
    const db = env({ listingChanges: true, staleListings: true, evaluations: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-summary?since=2026-08-26T12:00:00.000Z&staleBefore=2026-08-26T12:00:00.000Z',
      {},
      { DB: db }
    );
    const body = (await response.json()) as {
      changes: { newListings: Array<{ listingId: string }>; priceDrops: Array<{ listingId: string }> };
      staleListings: Array<{ listingId: string }>;
      thresholdMatches: Array<{ listingId: string; vehicleScore: number; dealScore: number }>;
    };

    assert.equal(response.status, 200);
    assert.equal(body.changes.newListings[0]?.listingId, 'listing-odyssey');
    assert.equal(body.changes.priceDrops[0]?.listingId, 'listing-sienna');
    assert.equal(body.staleListings[0]?.listingId, 'listing-odyssey');
    assert.equal(body.thresholdMatches.length, 1);
    assert.equal(body.thresholdMatches[0]?.listingId, 'listing-sienna');
    assert.ok((body.thresholdMatches[0]?.vehicleScore ?? 0) >= familySearchDefaults.notifications.minimumVehicleScore!);
    assert.ok((body.thresholdMatches[0]?.dealScore ?? 0) >= familySearchDefaults.notifications.minimumDealScore!);
    assert.equal(db.writes.length, 0);
  });

  it('validates monitoring summary requests', async () => {
    const missingWindow = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-summary?since=2026-08-26T12:00:00.000Z',
      {},
      env({ listingChanges: true, staleListings: true, evaluations: true })
    );
    const invalidWindow = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-summary?since=not-a-date&staleBefore=2026-08-26T12:00:00.000Z',
      {},
      env({ listingChanges: true, staleListings: true, evaluations: true })
    );
    const invalidStaleBefore = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-summary?since=2026-08-26T12:00:00.000Z&staleBefore=not-a-date',
      {},
      env({ listingChanges: true, staleListings: true, evaluations: true })
    );
    const missingSearch = await app.request(
      '/api/searches/missing/monitoring-summary?since=2026-08-26T12:00:00.000Z&staleBefore=2026-08-26T12:00:00.000Z',
      {},
      env({ listingChanges: true, staleListings: true, evaluations: true })
    );

    assert.equal(missingWindow.status, 400);
    assert.deepEqual(await missingWindow.json(), { error: 'invalid-stale-before' });
    assert.equal(invalidWindow.status, 400);
    assert.deepEqual(await invalidWindow.json(), { error: 'invalid-since' });
    assert.equal(invalidStaleBefore.status, 400);
    assert.deepEqual(await invalidStaleBefore.json(), { error: 'invalid-stale-before' });
    assert.equal(missingSearch.status, 404);
    assert.deepEqual(await missingSearch.json(), { error: 'not-found' });
  });

  it('returns no threshold matches when a search has no score thresholds', async () => {
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-summary?since=2026-08-26T12:00:00.000Z&staleBefore=2026-08-26T12:00:00.000Z',
      {},
      env({ listingChanges: true, staleListings: true, evaluations: true, noNotificationThresholds: true })
    );
    const body = (await response.json()) as { thresholdMatches: unknown[] };

    assert.equal(response.status, 200);
    assert.deepEqual(body.thresholdMatches, []);
  });

  it('returns a plain text monitoring digest', async () => {
    const db = env({ listingChanges: true, staleListings: true, evaluations: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-digest?since=2026-08-26T12:00:00.000Z&staleBefore=2026-08-26T12:00:00.000Z',
      {},
      { DB: db }
    );
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /^text\/plain/);
    assert.match(body, /Family replacement vehicle monitoring digest/);
    assert.match(body, /New listings: 1/);
    assert.match(body, /2013 Honda Odyssey/);
    assert.match(body, /Price drops: 1/);
    assert.match(body, /\$10,900 -> \$9,900/);
    assert.match(body, /Stale listings: 1/);
    assert.match(body, /Score threshold matches: 1/);
    assert.match(body, /2015 Toyota Sienna XLE vehicle 82, deal 91/);
    assert.equal(db.writes.length, 0);
  });

  it('returns an empty monitoring digest without broken sections', async () => {
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-digest?since=2026-08-26T12:00:00.000Z&staleBefore=2026-08-26T12:00:00.000Z',
      {},
      env()
    );
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(body, /New listings: 0/);
    assert.match(body, /Price drops: 0/);
    assert.match(body, /Stale listings: 0/);
    assert.match(body, /Score threshold matches: 0/);
  });

  it('validates monitoring digest requests', async () => {
    const missingWindow = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-digest?since=2026-08-26T12:00:00.000Z',
      {},
      env({ listingChanges: true, staleListings: true, evaluations: true })
    );
    const invalidWindow = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-digest?since=not-a-date&staleBefore=2026-08-26T12:00:00.000Z',
      {},
      env({ listingChanges: true, staleListings: true, evaluations: true })
    );
    const invalidStaleBefore = await app.request(
      '/api/searches/family-replacement-vehicle/monitoring-digest?since=2026-08-26T12:00:00.000Z&staleBefore=not-a-date',
      {},
      env({ listingChanges: true, staleListings: true, evaluations: true })
    );
    const missingSearch = await app.request(
      '/api/searches/missing/monitoring-digest?since=2026-08-26T12:00:00.000Z&staleBefore=2026-08-26T12:00:00.000Z',
      {},
      env({ listingChanges: true, staleListings: true, evaluations: true })
    );

    assert.equal(missingWindow.status, 400);
    assert.deepEqual(await missingWindow.json(), { error: 'invalid-stale-before' });
    assert.equal(invalidWindow.status, 400);
    assert.deepEqual(await invalidWindow.json(), { error: 'invalid-since' });
    assert.equal(invalidStaleBefore.status, 400);
    assert.deepEqual(await invalidStaleBefore.json(), { error: 'invalid-stale-before' });
    assert.equal(missingSearch.status, 404);
    assert.deepEqual(await missingSearch.json(), { error: 'not-found' });
  });

  it('returns listing detail with recent snapshots', async () => {
    const response = await app.request('/api/listings/listing-sienna', {}, env({ listingDetail: true, modelYearRisks: true, recallLookup: true }));
    const body = (await response.json()) as {
      listing: { title: string; vehicle: { vin: string }; seller: { phone: string }; price: { amount: number }; mileage: number };
      risks: Array<{ issue: string; inspectFor: string[] }>;
      recallLookup: { recalls: Array<{ campaignNumber: string; component: string }> };
      snapshots: Array<{ capturedAt: string; price: { amount: number }; mileage: number }>;
    };

    assert.equal(response.status, 200);
    assert.equal(body.listing.title, '2015 Toyota Sienna XLE');
    assert.equal(body.listing.vehicle.vin, '5TDYK3DC0FS000001');
    assert.equal(body.listing.seller.phone, '555-0100');
    assert.equal(body.listing.price.amount, 9900);
    assert.equal(body.listing.mileage, 93000);
    assert.equal(body.risks[0]?.issue, 'Generally preferred years, with power sliding-door operation still worth checking.');
    assert.deepEqual(body.risks[0]?.inspectFor, ['Test both power sliding doors']);
    assert.equal(body.recallLookup.recalls[0]?.campaignNumber, '16V858000');
    assert.equal(body.recallLookup.recalls[0]?.component, 'STRUCTURE');
    assert.deepEqual(
      body.snapshots.map((snapshot) => snapshot.capturedAt),
      ['2026-08-26T13:00:00.000Z', '2026-08-26T12:00:00.000Z']
    );
  });

  it('returns 404 for a missing listing detail', async () => {
    const response = await app.request('/api/listings/missing', {}, env({ listingDetail: true }));

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'not-found' });
  });

  it('returns null when no listing disposition exists', async () => {
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/listings/listing-sienna/disposition',
      {},
      env({ disposition: true })
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { disposition: null });
  });

  it('returns a saved listing disposition', async () => {
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/listings/listing-sienna/disposition',
      {},
      env({ disposition: 'existing' })
    );
    const body = (await response.json()) as { disposition: { state: string; nextAction: { type: string } } };

    assert.equal(response.status, 200);
    assert.equal(body.disposition.state, 'favorite');
    assert.equal(body.disposition.nextAction.type, 'schedule-inspection');
  });

  it('creates a listing disposition', async () => {
    const db = env({ disposition: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/listings/listing-sienna/disposition',
      {
        method: 'PUT',
        body: JSON.stringify({ state: 'interested', nextAction: { type: 'ask-maintenance-records' } }),
        headers: { 'content-type': 'application/json' }
      },
      { DB: db }
    );
    const body = (await response.json()) as { disposition: { state: string; nextAction: { type: string } } };

    assert.equal(response.status, 200);
    assert.equal(body.disposition.state, 'interested');
    assert.equal(body.disposition.nextAction.type, 'ask-maintenance-records');
    assert.ok(db.writes.some((write) => write.sql.startsWith('INSERT INTO listing_dispositions')));
  });

  it('updates an existing listing disposition', async () => {
    const db = env({ disposition: 'existing' }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/api/searches/family-replacement-vehicle/listings/listing-sienna/disposition',
      {
        method: 'PUT',
        body: JSON.stringify({ state: 'rejected', rejectionReason: 'Too many miles' }),
        headers: { 'content-type': 'application/json' }
      },
      { DB: db }
    );

    assert.equal(response.status, 200);
    assert.ok(db.writes.some((write) => write.sql.startsWith('UPDATE listing_dispositions')));
  });

  it('rejects invalid listing dispositions', async () => {
    const invalidState = await app.request(
      '/api/searches/family-replacement-vehicle/listings/listing-sienna/disposition',
      { method: 'PUT', body: JSON.stringify({ state: 'maybe' }), headers: { 'content-type': 'application/json' } },
      env({ disposition: true })
    );
    const rejectedWithoutReason = await app.request(
      '/api/searches/family-replacement-vehicle/listings/listing-sienna/disposition',
      { method: 'PUT', body: JSON.stringify({ state: 'rejected' }), headers: { 'content-type': 'application/json' } },
      env({ disposition: true })
    );

    assert.equal(invalidState.status, 400);
    assert.equal(rejectedWithoutReason.status, 400);
  });

  it('returns 404 when setting a disposition for a missing search or listing', async () => {
    const missingSearch = await app.request(
      '/api/searches/missing/listings/listing-sienna/disposition',
      { method: 'PUT', body: JSON.stringify({ state: 'favorite' }), headers: { 'content-type': 'application/json' } },
      env({ disposition: true })
    );
    const missingListing = await app.request(
      '/api/searches/family-replacement-vehicle/listings/missing/disposition',
      { method: 'PUT', body: JSON.stringify({ state: 'favorite' }), headers: { 'content-type': 'application/json' } },
      env({ disposition: true })
    );

    assert.equal(missingSearch.status, 404);
    assert.equal(missingListing.status, 404);
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
    let fetchCount = 0;

    globalThis.fetch = async () => new Response(dealerCarSearchHtml(++fetchCount));

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
      assert.equal(body.collectedCount, cypressDealerCarSearchSeeds.length);
      assert.equal(body.import.candidateCount, cypressDealerCarSearchSeeds.length);
      assert.equal(body.import.insertedListings, cypressDealerCarSearchSeeds.length);
      assert.equal(body.import.snapshotCount, cypressDealerCarSearchSeeds.length);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('requires the admin token for persisted search evaluation writes', async () => {
    const missingToken = await app.request('/api/admin/searches/family-replacement-vehicle/evaluations', { method: 'POST' }, env());
    const wrongToken = await app.request(
      '/api/admin/searches/family-replacement-vehicle/evaluations',
      { method: 'POST' },
      env({ adminToken: 'secret', persistedListings: true })
    );

    assert.equal(missingToken.status, 503);
    assert.equal(wrongToken.status, 401);
  });

  it('writes persisted search evaluations with the admin token', async () => {
    const db = env({ adminToken: 'secret', persistedListings: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/api/admin/searches/family-replacement-vehicle/evaluations',
      { method: 'POST', headers: { authorization: 'Bearer secret' } },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const body = (await response.json()) as { evaluation: { insertedEvaluations: number } };
    const evaluationWrites = db.writes.filter((write) => write.sql.startsWith('INSERT INTO search_evaluations'));

    assert.equal(response.status, 200);
    assert.equal(body.evaluation.insertedEvaluations, 2);
    assert.equal(evaluationWrites.length, 2);
    assert.equal(evaluationWrites[0]?.values[1], 'family-replacement-vehicle');
    assert.equal(evaluationWrites[0]?.values[2], 'sample-v1');
    assert.equal(evaluationWrites[0]?.values[8], 'listing-sienna');
    assert.match(String(evaluationWrites[0]?.values[5]), /model-preference|mileage-fit|budget-fit/);
    assert.match(String(evaluationWrites[0]?.values[6]), /^\[/);
  });

  it('returns 404 without evaluation writes for a missing saved search', async () => {
    const db = env({ adminToken: 'secret', persistedListings: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/api/admin/searches/missing/evaluations',
      { method: 'POST', headers: { authorization: 'Bearer secret' } },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );

    assert.equal(response.status, 404);
    assert.equal(db.writes.filter((write) => write.sql.startsWith('INSERT INTO search_evaluations')).length, 0);
  });

  it('requires the admin token for saved search refreshes', async () => {
    const missingToken = await app.request('/api/admin/searches/family-replacement-vehicle/refresh', { method: 'POST' }, env());
    const wrongToken = await app.request(
      '/api/admin/searches/family-replacement-vehicle/refresh',
      { method: 'POST' },
      env({ adminToken: 'secret', persistedListings: true })
    );

    assert.equal(missingToken.status, 503);
    assert.equal(wrongToken.status, 401);
  });

  it('returns 404 without refreshing a missing saved search', async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () => {
      throw new Error('fetch should not run');
    };

    try {
      const db = env({ adminToken: 'secret', persistedListings: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
      const response = await app.request(
        '/api/admin/searches/missing/refresh',
        { method: 'POST', headers: { authorization: 'Bearer secret' } },
        { DB: db, ADMIN_TOKEN: 'secret' }
      );

      assert.equal(response.status, 404);
      assert.equal(db.writes.length, 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('refreshes a saved search by collecting, importing, and evaluating', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;

    globalThis.fetch = async () => new Response(dealerCarSearchHtml(++fetchCount));

    try {
      const db = env({ adminToken: 'secret', persistedListings: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
      const response = await app.request(
        '/api/admin/searches/family-replacement-vehicle/refresh',
        { method: 'POST', headers: { authorization: 'Bearer secret' } },
        { DB: db, ADMIN_TOKEN: 'secret' }
      );
      const body = (await response.json()) as {
        searchId: string;
        collectedCount: number;
        import: { candidateCount: number; insertedListings: number; snapshotCount: number };
        evaluation: { insertedEvaluations: number };
      };

      assert.equal(response.status, 200);
      assert.equal(body.searchId, 'family-replacement-vehicle');
      assert.equal(body.collectedCount, cypressDealerCarSearchSeeds.length);
      assert.equal(body.import.candidateCount, cypressDealerCarSearchSeeds.length);
      assert.equal(body.import.insertedListings, cypressDealerCarSearchSeeds.length);
      assert.equal(body.import.snapshotCount, cypressDealerCarSearchSeeds.length);
      assert.equal(body.evaluation.insertedEvaluations, 2);
      assert.ok(db.writes.some((write) => write.sql.startsWith('INSERT INTO listing_snapshots')));
      assert.equal(db.writes.filter((write) => write.sql.startsWith('INSERT INTO search_evaluations')).length, 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('requires the admin token for VIN decoding', async () => {
    const response = await app.request('/api/admin/vin-decodes', { method: 'POST' }, env());

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'admin-token-not-configured' });
  });

  it('validates VIN decode requests', async () => {
    const response = await app.request(
      '/api/admin/vin-decodes',
      {
        method: 'POST',
        body: JSON.stringify({ vin: 'bad', modelYear: 1970 }),
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }
      },
      env({ adminToken: 'secret' })
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'invalid-vin-decode' });
  });

  it('decodes and caches a VIN with the admin token', async () => {
    const db = env({ adminToken: 'secret' }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      Response.json({
        Results: [
          {
            Make: 'HONDA',
            Model: 'Odyssey',
            Trim: 'EX-L',
            ErrorCode: '0',
            ErrorText: '0 - VIN decoded clean. Check Digit (9th position) is correct'
          }
        ]
      })) as typeof fetch;

    try {
      const response = await app.request(
        '/api/admin/vin-decodes',
        {
          method: 'POST',
          body: JSON.stringify({ vin: '5fnrl5h60gb000001', modelYear: 2016 }),
          headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }
        },
        { DB: db, ADMIN_TOKEN: 'secret' }
      );
      const body = (await response.json()) as { source: string; decode: { vin: string; make: string; model: string } };

      assert.equal(response.status, 200);
      assert.equal(body.source, 'live');
      assert.equal(body.decode.vin, '5FNRL5H60GB000001');
      assert.equal(body.decode.make, 'HONDA');
      assert.equal(body.decode.model, 'Odyssey');
      assert.ok(db.writes.some((write) => write.sql.startsWith('INSERT INTO vin_decodes')));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('decodes VINs for a saved search with the admin token', async () => {
    const db = env({ adminToken: 'secret', vinDecodeRows: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => Response.json({ Results: [{ Make: 'TOYOTA', Model: 'Sienna' }] })) as typeof fetch;

    try {
      const response = await app.request(
        '/api/admin/searches/family-replacement-vehicle/vin-decodes',
        { method: 'POST', headers: { authorization: 'Bearer secret' } },
        { DB: db, ADMIN_TOKEN: 'secret' }
      );
      const body = (await response.json()) as { candidateCount: number; decodedCount: number; cachedCount: number; failed: unknown[] };

      assert.equal(response.status, 200);
      assert.equal(body.candidateCount, 1);
      assert.equal(body.decodedCount, 1);
      assert.equal(body.cachedCount, 0);
      assert.deepEqual(body.failed, []);
      assert.ok(db.writes.some((write) => write.sql.startsWith('INSERT INTO vin_decodes')));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('requires the admin token for recall lookup', async () => {
    const response = await app.request('/api/admin/recalls', { method: 'POST' }, env());

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'admin-token-not-configured' });
  });

  it('validates recall lookup requests', async () => {
    const response = await app.request(
      '/api/admin/recalls',
      {
        method: 'POST',
        body: JSON.stringify({ modelYear: 1970, make: 'Toyota', model: 'Sienna' }),
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }
      },
      env({ adminToken: 'secret' })
    );

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: 'invalid-recall-lookup' });
  });

  it('looks up and caches recalls with the admin token', async () => {
    const db = env({ adminToken: 'secret' }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      Response.json({ results: [{ NHTSACampaignNumber: '16V858000', Component: 'STRUCTURE' }] })) as typeof fetch;

    try {
      const response = await app.request(
        '/api/admin/recalls',
        {
          method: 'POST',
          body: JSON.stringify({ modelYear: 2015, make: 'Toyota', model: 'Sienna' }),
          headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }
        },
        { DB: db, ADMIN_TOKEN: 'secret' }
      );
      const body = (await response.json()) as { source: string; lookup: { lookupKey: string; recalls: Array<{ campaignNumber: string }> } };

      assert.equal(response.status, 200);
      assert.equal(body.source, 'live');
      assert.equal(body.lookup.lookupKey, '2015:toyota:sienna');
      assert.equal(body.lookup.recalls[0]?.campaignNumber, '16V858000');
      assert.ok(db.writes.some((write) => write.sql.startsWith('INSERT INTO vehicle_recalls')));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('looks up recalls for a saved search with the admin token', async () => {
    const db = env({ adminToken: 'secret', recallSearchRows: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      Response.json({ results: [{ NHTSACampaignNumber: '16V858000', Component: 'STRUCTURE' }] })) as typeof fetch;

    try {
      const response = await app.request(
        '/api/admin/searches/family-replacement-vehicle/recalls',
        { method: 'POST', headers: { authorization: 'Bearer secret' } },
        { DB: db, ADMIN_TOKEN: 'secret' }
      );
      const body = (await response.json()) as { candidateCount: number; liveCount: number; cachedCount: number; failed: unknown[] };

      assert.equal(response.status, 200);
      assert.equal(body.candidateCount, 1);
      assert.equal(body.liveCount, 1);
      assert.equal(body.cachedCount, 0);
      assert.deepEqual(body.failed, []);
      assert.ok(db.writes.some((write) => write.sql.startsWith('INSERT INTO vehicle_recalls')));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('refreshes enabled saved searches for scheduled collection', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;

    globalThis.fetch = async () => new Response(dealerCarSearchHtml(++fetchCount));

    try {
      const db = env({ persistedListings: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
      const result = await refreshEnabledSavedSearches(db, '2026-08-26T18:00:00.000Z');

      assert.equal(result.collectedCount, cypressDealerCarSearchSeeds.length);
      assert.equal(result.imported.candidateCount, cypressDealerCarSearchSeeds.length);
      assert.equal(result.imported.snapshotCount, cypressDealerCarSearchSeeds.length);
      assert.equal(result.evaluatedSearches, 1);
      assert.equal(result.insertedEvaluations, 2);
      assert.ok(db.writes.some((write) => write.sql.startsWith('INSERT INTO listing_snapshots')));
      assert.equal(db.writes.filter((write) => write.sql.startsWith('INSERT INTO search_evaluations')).length, 2);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('requires the admin token for MCP tool preview routes', async () => {
    const missingTokenTools = await app.request('/api/admin/mcp/tools', {}, env());
    const wrongTokenTools = await app.request('/api/admin/mcp/tools', {}, env({ adminToken: 'secret' }));
    const missingTokenCall = await app.request('/api/admin/mcp/tools/list_saved_searches/call', { method: 'POST' }, env());
    const wrongTokenCall = await app.request(
      '/api/admin/mcp/tools/list_saved_searches/call',
      { method: 'POST' },
      env({ adminToken: 'secret' })
    );

    assert.equal(missingTokenTools.status, 503);
    assert.equal(wrongTokenTools.status, 401);
    assert.equal(missingTokenCall.status, 503);
    assert.equal(wrongTokenCall.status, 401);
  });

  it('requires the admin token for the MCP transport route', async () => {
    const missingToken = await app.request('/mcp', { method: 'POST' }, env());
    const wrongToken = await app.request('/mcp', { method: 'POST' }, env({ adminToken: 'secret' }));

    assert.equal(missingToken.status, 503);
    assert.equal(wrongToken.status, 401);
  });

  it('handles MCP transport JSON-RPC requests', async () => {
    const db = env({ adminToken: 'secret', persistedListings: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const initialized = await app.request(
      '/mcp',
      {
        method: 'POST',
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'init', method: 'initialize' })
      },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const tools = await app.request(
      '/mcp',
      {
        method: 'POST',
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'tools', method: 'tools/list' })
      },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const call = await app.request(
      '/mcp',
      {
        method: 'POST',
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'call',
          method: 'tools/call',
          params: { name: 'get_ranked_listings', arguments: { searchId: 'family-replacement-vehicle' } }
        })
      },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const initializedBody = (await initialized.json()) as { result: { capabilities: { tools: Record<string, never> } } };
    const toolsBody = (await tools.json()) as { result: { tools: Array<{ name: string }> } };
    const callBody = (await call.json()) as { result: { structuredContent: { rankedListings: unknown[] } } };

    assert.equal(initialized.status, 200);
    assert.deepEqual(initializedBody.result.capabilities, { tools: {} });
    assert.equal(tools.status, 200);
    assert.ok(toolsBody.result.tools.some((tool) => tool.name === 'get_ranked_listings'));
    assert.equal(call.status, 200);
    assert.equal(callBody.result.structuredContent.rankedListings.length, 2);
    assert.equal(db.writes.length, 0);
  });

  it('updates listing disposition through the MCP transport route', async () => {
    const db = env({ adminToken: 'secret' }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/mcp',
      {
        method: 'POST',
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'workflow',
          method: 'tools/call',
          params: {
            name: 'set_listing_disposition',
            arguments: {
              searchId: 'family-replacement-vehicle',
              listingId: 'listing-sienna',
              state: 'favorite',
              nextActionType: 'ask-out-the-door-price'
            }
          }
        })
      },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const body = (await response.json()) as { result: { structuredContent: { disposition: { state: string } } } };

    assert.equal(response.status, 200);
    assert.equal(body.result.structuredContent.disposition.state, 'favorite');
    assert.equal(db.writes.length, 1);
    assert.match(db.writes[0]?.sql ?? '', /INSERT INTO listing_dispositions/);
  });

  it('returns MCP JSON-RPC errors for parse and request errors', async () => {
    const invalidJson = await app.request(
      '/mcp',
      { method: 'POST', headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }, body: '{' },
      env({ adminToken: 'secret' })
    );
    const invalidRequest = await app.request(
      '/mcp',
      { method: 'POST', headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }, body: '[]' },
      env({ adminToken: 'secret' })
    );
    const unknownTool = await app.request(
      '/mcp',
      {
        method: 'POST',
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 'bad-tool', method: 'tools/call', params: { name: 'nope' } })
      },
      env({ adminToken: 'secret' })
    );

    assert.equal(invalidJson.status, 200);
    assert.equal(((await invalidJson.json()) as { error: { code: number } }).error.code, -32700);
    assert.equal(invalidRequest.status, 200);
    assert.equal(((await invalidRequest.json()) as { error: { code: number } }).error.code, -32600);
    assert.equal(unknownTool.status, 200);
    assert.deepEqual(((await unknownTool.json()) as { error: { data: unknown } }).error.data, { toolError: 'unknown-tool' });
  });

  it('lists MCP tool metadata through the protected preview route', async () => {
    const response = await app.request('/api/admin/mcp/tools', { headers: { authorization: 'Bearer secret' } }, env({ adminToken: 'secret' }));
    const body = (await response.json()) as { tools: Array<{ name: string; requiredArguments: string[]; inputSchema: { type: string; required: string[] } }> };

    assert.equal(response.status, 200);
    assert.ok(body.tools.some((tool) => tool.name === 'get_ranked_listings'));
    assert.deepEqual(body.tools.find((tool) => tool.name === 'get_monitoring_summary')?.requiredArguments, [
      'searchId',
      'since',
      'staleBefore'
    ]);
    assert.deepEqual(body.tools.find((tool) => tool.name === 'get_monitoring_summary')?.inputSchema.required, [
      'searchId',
      'since',
      'staleBefore'
    ]);
  });

  it('calls MCP tools through the protected preview route', async () => {
    const db = env({ adminToken: 'secret', persistedListings: true }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const noArgs = await app.request(
      '/api/admin/mcp/tools/list_saved_searches/call',
      { method: 'POST', headers: { authorization: 'Bearer secret' } },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const emptyArgs = await app.request(
      '/api/admin/mcp/tools/list_saved_searches/call',
      {
        method: 'POST',
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
        body: '{}'
      },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const withArgs = await app.request(
      '/api/admin/mcp/tools/get_ranked_listings/call',
      {
        method: 'POST',
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' },
        body: JSON.stringify({ searchId: 'family-replacement-vehicle' })
      },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const noArgsBody = (await noArgs.json()) as { ok: boolean; data: { searches: unknown[] } };
    const emptyArgsBody = (await emptyArgs.json()) as { ok: boolean; data: { searches: unknown[] } };
    const withArgsBody = (await withArgs.json()) as { ok: boolean; data: { rankedListings: unknown[] } };

    assert.equal(noArgs.status, 200);
    assert.equal(noArgsBody.ok, true);
    assert.equal(noArgsBody.data.searches.length, 1);
    assert.equal(emptyArgs.status, 200);
    assert.equal(emptyArgsBody.ok, true);
    assert.equal(emptyArgsBody.data.searches.length, 1);
    assert.equal(withArgs.status, 200);
    assert.equal(withArgsBody.ok, true);
    assert.equal(withArgsBody.data.rankedListings.length, 2);
    assert.equal(db.writes.length, 0);
  });

  it('validates MCP tool preview call bodies and tool names', async () => {
    const invalidJson = await app.request(
      '/api/admin/mcp/tools/list_saved_searches/call',
      { method: 'POST', headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }, body: '{' },
      env({ adminToken: 'secret' })
    );
    const arrayBody = await app.request(
      '/api/admin/mcp/tools/list_saved_searches/call',
      { method: 'POST', headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }, body: '[]' },
      env({ adminToken: 'secret' })
    );
    const nullBody = await app.request(
      '/api/admin/mcp/tools/list_saved_searches/call',
      { method: 'POST', headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }, body: 'null' },
      env({ adminToken: 'secret' })
    );
    const unknownTool = await app.request(
      '/api/admin/mcp/tools/nope/call',
      { method: 'POST', headers: { authorization: 'Bearer secret' } },
      env({ adminToken: 'secret' })
    );

    assert.equal(invalidJson.status, 400);
    assert.deepEqual(await invalidJson.json(), { error: 'invalid-json' });
    assert.equal(arrayBody.status, 400);
    assert.deepEqual(await arrayBody.json(), { ok: false, error: 'invalid-arguments' });
    assert.equal(nullBody.status, 400);
    assert.deepEqual(await nullBody.json(), { ok: false, error: 'invalid-arguments' });
    assert.equal(unknownTool.status, 400);
    assert.deepEqual(await unknownTool.json(), { ok: false, error: 'unknown-tool' });
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

  it('requires the admin token for saving manual imports', async () => {
    const response = await app.request('/api/admin/manual-imports', { method: 'POST' }, env());

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'admin-token-not-configured' });
  });

  it('saves a manual import and refreshes evaluations', async () => {
    const db = env({ adminToken: 'secret' }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/api/admin/manual-imports',
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
          titleStatus: 'clean'
        }),
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }
      },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const body = (await response.json()) as { import: { insertedListings: number; snapshotCount: number } };

    assert.equal(response.status, 200);
    assert.equal(body.import.insertedListings, 1);
    assert.equal(body.import.snapshotCount, 1);
    assert.ok(db.writes.some((write) => write.sql.startsWith('INSERT INTO listings')));
    assert.ok(db.writes.some((write) => write.sql.startsWith('INSERT INTO listing_snapshots')));
  });

  it('rejects invalid saved manual imports', async () => {
    const response = await app.request(
      '/api/admin/manual-imports',
      {
        method: 'POST',
        body: JSON.stringify({ searchId: 'family-replacement-vehicle', url: '', title: 'Missing URL' }),
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }
      },
      env({ adminToken: 'secret' })
    );

    assert.equal(response.status, 400);
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

  it('previews a bulk CSV listing import against a saved search', async () => {
    const response = await app.request(
      '/api/listing-imports/preview',
      {
        method: 'POST',
        body: JSON.stringify({
          searchId: 'family-replacement-vehicle',
          format: 'csv',
          text: [
            'url,title,year,make,model,price,mileage,sellerName,sellerType',
            'https://example.test/bulk-sienna,2015 Toyota Sienna XLE,2015,Toyota,Sienna,14900,93000,Bulk Dealer,dealer'
          ].join('\n')
        }),
        headers: { 'content-type': 'application/json' }
      },
      env()
    );
    const body = (await response.json()) as { candidateCount: number; rankedListings: Array<{ dealScore: number }> };

    assert.equal(response.status, 200);
    assert.equal(body.candidateCount, 1);
    assert.ok(body.rankedListings[0]?.dealScore);
  });

  it('saves a bulk JSON listing import and refreshes evaluations', async () => {
    const db = env({ adminToken: 'secret' }).DB as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
    const response = await app.request(
      '/api/admin/listing-imports',
      {
        method: 'POST',
        body: JSON.stringify({
          searchId: 'family-replacement-vehicle',
          format: 'json',
          text: JSON.stringify([
            {
              url: 'https://example.test/bulk-odyssey',
              title: '2016 Honda Odyssey EX-L',
              year: 2016,
              make: 'Honda',
              model: 'Odyssey',
              price: 12900,
              mileage: 104000,
              sellerName: 'Bulk Dealer',
              sellerType: 'dealer'
            }
          ])
        }),
        headers: { authorization: 'Bearer secret', 'content-type': 'application/json' }
      },
      { DB: db, ADMIN_TOKEN: 'secret' }
    );
    const body = (await response.json()) as { candidateCount: number; import: { insertedListings: number; snapshotCount: number } };

    assert.equal(response.status, 200);
    assert.equal(body.candidateCount, 1);
    assert.equal(body.import.insertedListings, 1);
    assert.equal(body.import.snapshotCount, 1);
  });

  it('returns 404 for a missing saved search', async () => {
    const response = await app.request('/api/searches/missing', {}, env());

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: 'not-found' });
  });
});

function dealerCarSearchHtml(index: number): string {
  return `
    <div>
      <a>2013 Honda Odyssey</a>
      <span>$7,890</span>
      <span>Mileage:</span><span>163,707</span>
      <span>VIN: 5FNRL5H95DB02865${index}</span>
    </div>
  `;
}

function env(
  options: {
    adminToken?: string;
    persistedListings?: boolean;
    listingDetail?: boolean;
    listingChanges?: boolean;
    staleListings?: boolean;
    noNotificationThresholds?: boolean;
    disposition?: true | 'existing';
    evaluations?: boolean;
    modelYearRisks?: boolean;
    vinDecodeRows?: boolean;
    recallSearchRows?: boolean;
    recallLookup?: boolean;
    assetRequests?: string[];
  } = {}
): Env {
  const writes: Array<{ sql: string; values: unknown[] }> = [];
  const searchRow = options.noNotificationThresholds
    ? { ...savedSearchRow, config_json: JSON.stringify({ ...familySearchDefaults, notifications: {} }) }
    : savedSearchRow;

  return {
    ...(options.adminToken ? { ADMIN_TOKEN: options.adminToken } : {}),
    ...(options.assetRequests
      ? {
          ASSETS: {
            fetch: async (request: Request) => {
              options.assetRequests?.push(request.url);
              return new Response('<html>dashboard</html>', { headers: { 'content-type': 'text/html' } });
            }
          }
        }
      : {}),
    DB: {
      prepare: (sql: string) => ({
        bind: (...values: string[]) => {
          const [id, listingId] = values;

          return {
            first: async () => {
              if (sql.includes('FROM saved_searches')) return id === savedSearchRow.id ? searchRow : null;
              if (sql === 'SELECT id FROM listings WHERE id = ?') return id === 'listing-sienna' ? { id } : null;
              if (options.listingDetail && sql.includes('WHERE listings.id = ?')) return id === 'listing-sienna' ? betterPersistedListingRow : null;
              if (options.recallLookup && sql.includes('FROM vehicle_recalls')) return recallLookupRow;
              if (options.disposition && sql.includes('FROM listing_dispositions')) {
                return options.disposition === 'existing' && id === savedSearchRow.id && listingId === 'listing-sienna' ? dispositionRow : null;
              }
              return null;
            },
            all: async () => ({
              results:
                options.persistedListings && id === savedSearchRow.id && sql.includes('FROM listings') && sql.includes('LEFT JOIN listing_dispositions')
                  ? [persistedListingRow, betterPersistedListingRow]
                  : options.evaluations && id === savedSearchRow.id && sql.includes('MAX(latest.evaluated_at)') && sql.includes('ORDER BY search_evaluations.deal_score DESC')
                    ? evaluationRows
                  : options.listingChanges && id === savedSearchRow.id && sql.includes('listings.first_seen_at > ?')
                    ? [newListingChangeRow]
                  : options.listingChanges && id === savedSearchRow.id && sql.includes('latest.price_amount < previous.price_amount')
                    ? [priceDropChangeRow]
                  : options.staleListings && id === savedSearchRow.id && sql.includes('listings.last_seen_at < ?')
                    ? [staleListingRow]
                  : options.modelYearRisks && sql.includes('FROM model_year_risks')
                    ? [modelYearRiskRow]
                  : options.vinDecodeRows && sql.includes('SELECT DISTINCT vehicles.vin')
                    ? [{ vin: '5TDYK3DC0FS000001', year: 2015 }]
                  : options.recallSearchRows && sql.includes('SELECT DISTINCT vehicles.year')
                    ? [{ year: 2015, make: 'Toyota', model: 'Sienna' }]
                  : options.listingDetail && id === 'listing-sienna' && sql.includes('FROM listing_snapshots') && sql.includes('WHERE listing_id = ?')
                  ? snapshotRows
                  : []
            }),
            run: async () => {
              writes.push({ sql: sql.trim(), values });
              return { success: true };
            }
          };
        },
        all: async () => ({
          results: sql.includes('FROM saved_searches')
            ? [searchRow]
            : options.evaluations && sql.includes('MAX(latest.evaluated_at)') && sql.includes('ORDER BY search_evaluations.deal_score DESC')
              ? evaluationRows
            : options.listingDetail && sql.includes('FROM listing_snapshots') && sql.includes('WHERE listing_id = ?')
              ? snapshotRows
              : []
        })
      }),
      writes
    } as unknown as D1Database & { writes: Array<{ sql: string; values: unknown[] }> }
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
  photo_urls_json: null,
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
  seller_location_label: null,
  disposition_id: null,
  disposition_saved_search_id: null,
  disposition_listing_id: null,
  disposition_state: null,
  disposition_rejection_reason: null,
  disposition_next_action_json: null,
  disposition_updated_at: null
};

const snapshotRows = [
  {
    id: 'snapshot-new',
    captured_at: '2026-08-26T13:00:00.000Z',
    price_amount: 9900,
    price_currency: 'USD',
    mileage: 93000,
    photo_urls_json: null,
    status: 'active',
    raw_title: '2015 Toyota Sienna XLE',
    raw_description: null
  },
  {
    id: 'snapshot-old',
    captured_at: '2026-08-26T12:00:00.000Z',
    price_amount: 10900,
    price_currency: 'USD',
    mileage: 93100,
    photo_urls_json: null,
    status: 'active',
    raw_title: '2015 Toyota Sienna XLE',
    raw_description: null
  }
];

const modelYearRiskRow = {
  id: 'risk-toyota-sienna-2015-2016-sliding-doors',
  make: 'Toyota',
  model: 'Sienna',
  year_start: 2015,
  year_end: 2016,
  rating: 'preferred',
  trim_json: null,
  engine_json: null,
  transmission_json: null,
  issue: 'Generally preferred years, with power sliding-door operation still worth checking.',
  category: 'body',
  severity: 3,
  inspect_for_json: JSON.stringify(['Test both power sliding doors']),
  remediation_json: null,
  evidence_ids_json: JSON.stringify([])
};

const recallLookupRow = {
  lookup_key: '2015:toyota:sienna',
  model_year: 2015,
  make: 'Toyota',
  model: 'Sienna',
  recalls_json: JSON.stringify([{ campaignNumber: '16V858000', component: 'STRUCTURE', raw: {} }]),
  checked_at: '2026-08-27T00:00:00.000Z'
};

const dispositionRow = {
  id: 'disposition-sienna',
  saved_search_id: 'family-replacement-vehicle',
  listing_id: 'listing-sienna',
  state: 'favorite',
  rejection_reason: null,
  next_action_json: JSON.stringify({ type: 'schedule-inspection' }),
  updated_at: '2026-08-26T14:00:00.000Z'
};

const evaluationRows = [
  {
    id: 'evaluation-sienna',
    saved_search_id: 'family-replacement-vehicle',
    listing_id: 'listing-sienna',
    vehicle_id: 'vehicle-sienna',
    score_version: 'sample-v1',
    vehicle_score: 82,
    deal_score: 91,
    factors_json: JSON.stringify([{ key: 'budget-fit', messageKey: 'score.budgetFit', scoreImpact: 18 }]),
    flags_json: JSON.stringify(['missing-maintenance-evidence']),
    evaluated_at: '2026-08-26T14:00:00.000Z',
    listing_title: '2015 Toyota Sienna XLE',
    listing_url: 'https://example.test/sienna',
    vin: '5TDYK3DC0FS000001',
    year: 2015,
    make: 'Toyota',
    model: 'Sienna'
  },
  {
    id: 'evaluation-odyssey',
    saved_search_id: 'family-replacement-vehicle',
    listing_id: 'listing-odyssey',
    vehicle_id: 'vehicle-odyssey',
    score_version: 'sample-v1',
    vehicle_score: 65,
    deal_score: 80,
    factors_json: JSON.stringify([{ key: 'mileage-fit', messageKey: 'score.mileageFit', scoreImpact: -8 }]),
    flags_json: JSON.stringify([]),
    evaluated_at: '2026-08-26T14:00:00.000Z',
    listing_title: '2013 Honda Odyssey',
    listing_url: 'https://example.test/odyssey',
    vin: '5FNRL5H95DB028656',
    year: 2013,
    make: 'Honda',
    model: 'Odyssey'
  }
];

const newListingChangeRow = {
  listing_id: 'listing-odyssey',
  title: '2013 Honda Odyssey',
  url: 'https://example.test/odyssey',
  detected_at: '2026-08-26T14:00:00.000Z',
  current_price_amount: 7890,
  previous_price_amount: null,
  current_price_currency: 'USD',
  previous_price_currency: null
};

const priceDropChangeRow = {
  listing_id: 'listing-sienna',
  title: '2015 Toyota Sienna XLE',
  url: 'https://example.test/sienna',
  detected_at: '2026-08-26T13:00:00.000Z',
  current_price_amount: 9900,
  previous_price_amount: 10900,
  current_price_currency: 'USD',
  previous_price_currency: 'USD'
};

const staleListingRow = {
  listing_id: 'listing-odyssey',
  title: '2013 Honda Odyssey',
  url: 'https://example.test/odyssey',
  last_seen_at: '2026-08-25T12:00:00.000Z',
  price_amount: 7890,
  price_currency: 'USD'
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
  seller_phone: '555-0100',
  disposition_id: 'disposition-sienna',
  disposition_saved_search_id: 'family-replacement-vehicle',
  disposition_listing_id: 'listing-sienna',
  disposition_state: 'favorite',
  disposition_rejection_reason: null,
  disposition_next_action_json: null,
  disposition_updated_at: '2026-08-26T14:00:00.000Z'
};
