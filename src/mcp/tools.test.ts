import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { familySearchDefaults } from '../domain/search-config.js';
import { callMcpTool, mcpToolNames, mcpTools } from './tools.js';

const savedSearchRow = {
  id: 'family-replacement-vehicle',
  user_id: 'family',
  name: 'Family replacement vehicle',
  enabled: 1,
  config_json: JSON.stringify(familySearchDefaults),
  created_at: '2026-08-25T00:00:00.000Z',
  updated_at: '2026-08-25T00:00:00.000Z'
};

describe('MCP read tool handlers', () => {
  it('defines metadata for each read tool', () => {
    assert.deepEqual(
      mcpTools.map((tool) => tool.name),
      [...mcpToolNames]
    );
    assert.ok(mcpTools.every((tool) => tool.description && Array.isArray(tool.requiredArguments)));
  });

  it('rejects unknown tools and invalid arguments without throwing', async () => {
    const db = fakeDb();

    assert.deepEqual(await callMcpTool(db, 'missing_tool'), { ok: false, error: 'unknown-tool' });
    assert.deepEqual(await callMcpTool(db, 'get_saved_search'), { ok: false, error: 'invalid-arguments' });
    assert.deepEqual(await callMcpTool(db, 'get_saved_search', { searchId: '   ' }), { ok: false, error: 'invalid-arguments' });
    assert.deepEqual(
      await callMcpTool(db, 'get_monitoring_summary', {
        searchId: 'family-replacement-vehicle',
        since: 'not-a-date',
        staleBefore: '2026-08-26T12:00:00.000Z'
      }),
      { ok: false, error: 'invalid-arguments' }
    );
  });

  it('returns not found for missing saved searches and listings', async () => {
    const db = fakeDb();

    assert.deepEqual(await callMcpTool(db, 'get_saved_search', { searchId: 'missing' }), { ok: false, error: 'not-found' });
    assert.deepEqual(await callMcpTool(db, 'get_ranked_listings', { searchId: 'missing' }), { ok: false, error: 'not-found' });
    assert.deepEqual(await callMcpTool(db, 'get_listing_detail', { listingId: 'missing' }), { ok: false, error: 'not-found' });
    assert.deepEqual(
      await callMcpTool(db, 'get_listing_disposition', { searchId: 'missing', listingId: 'listing-sienna' }),
      { ok: false, error: 'not-found' }
    );
  });

  it('dispatches saved search, ranking, detail, snapshot, evaluation, and disposition reads', async () => {
    const db = fakeDb({ persistedListings: true, listingDetail: true, evaluations: true, disposition: true });

    const searches = await callMcpTool(db, 'list_saved_searches');
    const ranked = await callMcpTool(db, 'get_ranked_listings', { searchId: 'family-replacement-vehicle' });
    const detail = await callMcpTool(db, 'get_listing_detail', { listingId: 'listing-sienna' });
    const snapshots = await callMcpTool(db, 'get_listing_snapshots', { listingId: 'listing-sienna' });
    const evaluations = await callMcpTool(db, 'get_latest_evaluations', { searchId: 'family-replacement-vehicle' });
    const disposition = await callMcpTool(db, 'get_listing_disposition', {
      searchId: 'family-replacement-vehicle',
      listingId: 'listing-sienna'
    });

    assert.equal(searches.ok, true);
    assert.equal(ranked.ok, true);
    assert.equal(detail.ok, true);
    assert.equal(snapshots.ok, true);
    assert.equal(evaluations.ok, true);
    assert.equal(disposition.ok, true);
    assert.equal(((ranked as { ok: true; data: { rankedListings: unknown[] } }).data.rankedListings).length, 2);
    assert.equal(((snapshots as { ok: true; data: { snapshots: unknown[] } }).data.snapshots).length, 2);
    assert.equal(((disposition as { ok: true; data: { disposition: { state: string } } }).data.disposition).state, 'favorite');
    assert.equal(db.writes.length, 0);
  });

  it('dispatches monitoring summary and digest reads', async () => {
    const db = fakeDb({ listingChanges: true, staleListings: true, evaluations: true });
    const args = {
      searchId: 'family-replacement-vehicle',
      since: '2026-08-26T12:00:00.000Z',
      staleBefore: '2026-08-26T12:00:00.000Z'
    };

    const summary = await callMcpTool(db, 'get_monitoring_summary', args);
    const digest = await callMcpTool(db, 'get_monitoring_digest', args);

    assert.equal(summary.ok, true);
    assert.equal(digest.ok, true);
    assert.equal(((summary as { ok: true; data: { thresholdMatches: unknown[] } }).data.thresholdMatches).length, 1);
    assert.match(((digest as { ok: true; data: { text: string } }).data.text), /Family replacement vehicle monitoring digest/);
    assert.match(((digest as { ok: true; data: { text: string } }).data.text), /Price drops: 1/);
    assert.equal(db.writes.length, 0);
  });

  it('returns no monitoring threshold matches when no thresholds are configured', async () => {
    const result = await callMcpTool(
      fakeDb({ listingChanges: true, staleListings: true, evaluations: true, noNotificationThresholds: true }),
      'get_monitoring_summary',
      {
        searchId: 'family-replacement-vehicle',
        since: '2026-08-26T12:00:00.000Z',
        staleBefore: '2026-08-26T12:00:00.000Z'
      }
    );

    assert.equal(result.ok, true);
    assert.deepEqual((result as { ok: true; data: { thresholdMatches: unknown[] } }).data.thresholdMatches, []);
  });
});

interface FakeOptions {
  persistedListings?: boolean;
  listingDetail?: boolean;
  listingChanges?: boolean;
  staleListings?: boolean;
  noNotificationThresholds?: boolean;
  evaluations?: boolean;
  disposition?: boolean;
}

function fakeDb(options: FakeOptions = {}): D1Database & { writes: Array<{ sql: string; values: unknown[] }> } {
  const writes: Array<{ sql: string; values: unknown[] }> = [];
  const searchRow = options.noNotificationThresholds
    ? { ...savedSearchRow, config_json: JSON.stringify({ ...familySearchDefaults, notifications: {} }) }
    : savedSearchRow;

  return {
    prepare: (sql: string) => ({
      bind: (...values: string[]) => {
        const [id, listingId] = values;

        return {
          first: async () => {
            if (sql.includes('FROM saved_searches')) return id === savedSearchRow.id ? searchRow : null;
            if (options.listingDetail && sql.includes('WHERE listings.id = ?')) return id === 'listing-sienna' ? persistedListingRow : null;
            if (options.disposition && sql.includes('FROM listing_dispositions')) {
              return id === savedSearchRow.id && listingId === 'listing-sienna' ? dispositionRow : null;
            }
            return null;
          },
          all: async () => ({
            results:
              options.persistedListings && id === savedSearchRow.id && sql.includes('FROM listings') && sql.includes('LEFT JOIN listing_dispositions')
                ? [persistedListingRow, secondPersistedListingRow]
                : options.evaluations && id === savedSearchRow.id && sql.includes('MAX(latest.evaluated_at)')
                  ? evaluationRows
                : options.listingChanges && id === savedSearchRow.id && sql.includes('listings.first_seen_at > ?')
                  ? [newListingChangeRow]
                : options.listingChanges && id === savedSearchRow.id && sql.includes('latest.price_amount < previous.price_amount')
                  ? [priceDropChangeRow]
                : options.staleListings && id === savedSearchRow.id && sql.includes('listings.last_seen_at < ?')
                  ? [staleListingRow]
                : options.listingDetail && id === 'listing-sienna' && sql.includes('FROM listing_snapshots')
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
        results: sql.includes('FROM saved_searches') ? [searchRow] : []
      })
    }),
    writes
  } as unknown as D1Database & { writes: Array<{ sql: string; values: unknown[] }> };
}

const persistedListingRow = {
  id: 'listing-sienna',
  source_name: 'dealer car search seeded dealer',
  source_access: 'structured-web',
  source_listing_id: '5TDYK3DC0FS000001',
  url: 'https://example.test/sienna',
  title: '2015 Toyota Sienna XLE',
  status: 'active',
  price_amount: 9900,
  price_currency: 'USD',
  mileage: 93000,
  title_status: 'clean',
  listing_latitude: null,
  listing_longitude: null,
  listing_location_label: null,
  last_seen_at: '2026-08-26T13:00:00.000Z',
  vin: '5TDYK3DC0FS000001',
  year: 2015,
  make: 'Toyota',
  model: 'Sienna',
  trim: null,
  seller_name: 'Trade Lane Motors',
  seller_type: 'dealer',
  seller_phone: '555-0100',
  seller_website_url: 'https://example.test',
  seller_latitude: null,
  seller_longitude: null,
  seller_location_label: null,
  disposition_id: 'disposition-sienna',
  disposition_saved_search_id: 'family-replacement-vehicle',
  disposition_listing_id: 'listing-sienna',
  disposition_state: 'favorite',
  disposition_rejection_reason: null,
  disposition_next_action_json: null,
  disposition_updated_at: '2026-08-26T14:00:00.000Z'
};

const secondPersistedListingRow = {
  ...persistedListingRow,
  id: 'listing-odyssey',
  source_listing_id: '5FNRL5H95DB028656',
  title: '2013 Honda Odyssey',
  price_amount: 7890,
  mileage: 163707,
  vin: '5FNRL5H95DB028656',
  year: 2013,
  make: 'Honda',
  model: 'Odyssey',
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
    status: 'active',
    raw_title: '2015 Toyota Sienna XLE',
    raw_description: null
  }
];

const dispositionRow = {
  id: 'disposition-sienna',
  saved_search_id: 'family-replacement-vehicle',
  listing_id: 'listing-sienna',
  state: 'favorite',
  rejection_reason: null,
  next_action_json: null,
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
    flags_json: JSON.stringify([]),
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
    factors_json: JSON.stringify([]),
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
