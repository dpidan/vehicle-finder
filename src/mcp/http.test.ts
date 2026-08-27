import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { familySearchDefaults } from '../domain/search-config.js';
import { handleMcpHttpRequest } from './http.js';

const savedSearchRow = {
  id: 'family-replacement-vehicle',
  user_id: 'family',
  name: 'Family replacement vehicle',
  enabled: 1,
  config_json: JSON.stringify(familySearchDefaults),
  created_at: '2026-08-25T00:00:00.000Z',
  updated_at: '2026-08-25T00:00:00.000Z'
};

describe('minimal MCP HTTP transport', () => {
  it('initializes with tools-only capabilities', async () => {
    const response = await handleMcpHttpRequest(fakeDb(), { jsonrpc: '2.0', id: 'init-1', method: 'initialize' });
    const body = (await response.json()) as {
      id: string;
      result: { protocolVersion: string; serverInfo: { name: string }; capabilities: { tools: Record<string, never> } };
    };

    assert.equal(response.status, 200);
    assert.equal(body.id, 'init-1');
    assert.equal(body.result.serverInfo.name, 'vehicle-finder');
    assert.deepEqual(body.result.capabilities, { tools: {} });
  });

  it('lists tools in a JSON-RPC envelope', async () => {
    const response = await handleMcpHttpRequest(fakeDb(), { jsonrpc: '2.0', id: 'tools-1', method: 'tools/list' });
    const body = (await response.json()) as { id: string; result: { tools: Array<{ name: string; inputSchema: { type: string } }> } };

    assert.equal(response.status, 200);
    assert.equal(body.id, 'tools-1');
    assert.ok(body.result.tools.some((tool) => tool.name === 'get_ranked_listings'));
    assert.equal(body.result.tools.find((tool) => tool.name === 'get_ranked_listings')?.inputSchema.type, 'object');
  });

  it('calls tools in a JSON-RPC envelope', async () => {
    const db = fakeDb({ persistedListings: true });
    const response = await handleMcpHttpRequest(db, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'get_ranked_listings', arguments: { searchId: 'family-replacement-vehicle' } }
    });
    const body = (await response.json()) as {
      id: number;
      result: { content: Array<{ type: string; text: string }>; structuredContent: { rankedListings: unknown[] } };
    };

    assert.equal(response.status, 200);
    assert.equal(body.id, 2);
    assert.equal(body.result.content[0]?.type, 'text');
    assert.equal(body.result.structuredContent.rankedListings.length, 1);
    assert.equal(db.writes.length, 0);
  });

  it('returns JSON-RPC errors for invalid requests, methods, params, and tool errors', async () => {
    const invalidRequest = await handleMcpHttpRequest(fakeDb(), []);
    const unsupportedMethod = await handleMcpHttpRequest(fakeDb(), { jsonrpc: '2.0', id: 'x', method: 'resources/list' });
    const invalidParams = await handleMcpHttpRequest(fakeDb(), { jsonrpc: '2.0', id: 'x', method: 'tools/call', params: [] });
    const unknownTool = await handleMcpHttpRequest(fakeDb(), {
      jsonrpc: '2.0',
      id: 'x',
      method: 'tools/call',
      params: { name: 'unknown' }
    });

    assert.equal(((await invalidRequest.json()) as { error: { code: number } }).error.code, -32600);
    assert.equal(((await unsupportedMethod.json()) as { error: { code: number } }).error.code, -32601);
    assert.equal(((await invalidParams.json()) as { error: { code: number } }).error.code, -32602);
    assert.deepEqual(((await unknownTool.json()) as { error: { data: unknown } }).error.data, { toolError: 'unknown-tool' });
  });
});

function fakeDb(options: { persistedListings?: boolean } = {}): D1Database & { writes: Array<{ sql: string; values: unknown[] }> } {
  const writes: Array<{ sql: string; values: unknown[] }> = [];

  return {
    prepare: (sql: string) => ({
      bind: (...values: string[]) => {
        const [id] = values;

        return {
          first: async () => (sql.includes('FROM saved_searches') && id === savedSearchRow.id ? savedSearchRow : null),
          all: async () => ({
            results:
              options.persistedListings && id === savedSearchRow.id && sql.includes('FROM listings') && sql.includes('LEFT JOIN listing_dispositions')
                ? [persistedListingRow]
                : []
          }),
          run: async () => {
            writes.push({ sql: sql.trim(), values });
            return { success: true };
          }
        };
      },
      all: async () => ({ results: sql.includes('FROM saved_searches') ? [savedSearchRow] : [] })
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
  seller_phone: null,
  seller_website_url: null,
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
