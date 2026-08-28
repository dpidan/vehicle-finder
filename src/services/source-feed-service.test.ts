import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { collectSourceFeed, listSourceFeeds } from './source-feed-service.js';

describe('source feed service', () => {
  it('maps source feed rows with joined seller details', async () => {
    const feeds = await listSourceFeeds(fakeDb([
      {
        id: 'feed-cargurus-vsa-motorcars',
        seller_id: 'seller-vsa-motorcars',
        name: 'VSA Motorcars on CarGurus',
        adapter_key: 'cargurus',
        access: 'structured-web',
        status: 'paused',
        inventory_url: 'https://www.cargurus.com/Cars/m-VSA-Motorcars-sp354407',
        website_url: 'https://www.vsamotorcars.com',
        collection_priority: 110,
        last_collected_at: null,
        last_status: null,
        last_error: null,
        notes: 'Adapter-development feed.',
        created_at: '2026-08-28T00:00:00.000Z',
        updated_at: '2026-08-28T00:00:00.000Z',
        seller_name: 'VSA Motorcars',
        seller_type: 'dealer',
        seller_phone: null,
        seller_website_url: 'https://www.vsamotorcars.com',
        seller_latitude: 29.9809,
        seller_longitude: -95.655,
        seller_location_label: '12212 Cypress N. Houston RD #1, Cypress, TX 77429'
      }
    ]) as unknown as D1Database);

    assert.equal(feeds.length, 1);
    assert.equal(feeds[0]?.adapterKey, 'cargurus');
    assert.equal(feeds[0]?.status, 'paused');
    assert.equal(feeds[0]?.seller?.name, 'VSA Motorcars');
    assert.equal(feeds[0]?.seller?.location?.label, '12212 Cypress N. Houston RD #1, Cypress, TX 77429');
  });

  it('returns no feeds before the source_feeds migration exists', async () => {
    const feeds = await listSourceFeeds(fakeDb([], new Error('no such table: source_feeds')) as unknown as D1Database);

    assert.deepEqual(feeds, []);
  });

  it('records adapter errors when a single feed import run fails', async () => {
    const originalFetch = globalThis.fetch;
    const db = fakeDb([feedRow()]);

    globalThis.fetch = async () => {
      throw new Error('network unavailable');
    };

    try {
      const run = await collectSourceFeed(db as unknown as D1Database, 'feed-cargurus-vsa-motorcars', '2026-08-28T12:00:00.000Z', true);

      assert.equal(run?.candidates.length, 0);
      assert.equal(db.writes.length, 1);
      assert.match(db.writes[0]?.sql ?? '', /last_status = 'error'/);
      assert.equal(db.writes[0]?.values[1], 'network unavailable');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

function fakeDb(rows: unknown[], error?: Error) {
  const writes: Array<{ sql: string; values: unknown[] }> = [];

  return {
    writes,
    prepare(sql: string) {
      return {
        bind(...values: unknown[]) {
          return {
            async all() {
              if (error) {
                throw error;
              }

              return { results: rows };
            },
            async run() {
              writes.push({ sql, values });
              return { success: true };
            }
          };
        },
        async all() {
          if (error) {
            throw error;
          }

          return { results: rows };
        },
        async run() {
          writes.push({ sql, values: [] });
          return { success: true };
        }
      };
    }
  };
}

function feedRow() {
  return {
    id: 'feed-cargurus-vsa-motorcars',
    seller_id: 'seller-vsa-motorcars',
    name: 'VSA Motorcars on CarGurus',
    adapter_key: 'cargurus',
    access: 'structured-web',
    status: 'paused',
    inventory_url: 'https://www.cargurus.com/Cars/m-VSA-Motorcars-sp354407',
    website_url: 'https://www.vsamotorcars.com',
    collection_priority: 110,
    last_collected_at: null,
    last_status: null,
    last_error: null,
    notes: 'Adapter-development feed.',
    created_at: '2026-08-28T00:00:00.000Z',
    updated_at: '2026-08-28T00:00:00.000Z',
    seller_name: 'VSA Motorcars',
    seller_type: 'dealer',
    seller_phone: null,
    seller_website_url: 'https://www.vsamotorcars.com',
    seller_latitude: 29.9809,
    seller_longitude: -95.655,
    seller_location_label: '12212 Cypress N. Houston RD #1, Cypress, TX 77429'
  };
}
