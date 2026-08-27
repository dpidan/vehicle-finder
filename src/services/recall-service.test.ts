import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { lookupRecalls, recallLookupKey } from './recall-service.js';

describe('recall service', () => {
  it('builds stable recall lookup keys', () => {
    assert.equal(recallLookupKey(2015, ' Toyota ', ' Sienna '), '2015:toyota:sienna');
    assert.throws(() => recallLookupKey(1899, 'Toyota', 'Sienna'), /valid integer year/);
    assert.throws(() => recallLookupKey(2015, '', 'Sienna'), /required/);
  });

  it('looks up recalls and caches results', async () => {
    const db = fakeRecallDb();
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount += 1;
      return Response.json({
        results: [
          {
            NHTSACampaignNumber: '16V858000',
            Component: 'STRUCTURE',
            Summary: 'Sample recall summary.',
            Consequence: 'Sample consequence.',
            Remedy: 'Sample remedy.',
            ReportReceivedDate: 'Nov 29, 2016'
          }
        ]
      });
    };

    const live = await lookupRecalls(db, 2015, 'Toyota', 'Sienna', '2026-08-27T00:00:00.000Z', fetcher);
    const cached = await lookupRecalls(db, 2015, 'Toyota', 'Sienna', '2026-08-28T00:00:00.000Z', fetcher);

    assert.equal(fetchCount, 1);
    assert.equal(live.source, 'live');
    assert.equal(cached.source, 'cache');
    assert.equal(live.lookup.recalls[0]?.campaignNumber, '16V858000');
    assert.equal(cached.lookup.checkedAt, '2026-08-27T00:00:00.000Z');
  });
});

function fakeRecallDb(): D1Database {
  const rows = new Map<string, Record<string, unknown>>();

  return {
    prepare: () => ({
      bind: (...values: unknown[]) => ({
        first: async () => rows.get(String(values[0])) ?? null,
        run: async () => {
          rows.set(String(values[0]), {
            lookup_key: values[0],
            model_year: values[1],
            make: values[2],
            model: values[3],
            recalls_json: values[4],
            checked_at: values[5]
          });
          return { success: true };
        },
        all: async () => ({ results: [] })
      }),
      first: async () => null,
      run: async () => ({ success: true }),
      all: async () => ({ results: [] })
    })
  } as unknown as D1Database;
}
