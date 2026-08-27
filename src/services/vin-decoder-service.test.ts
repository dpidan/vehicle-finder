import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decodeSavedSearchVins, decodeVin, normalizeVin } from './vin-decoder-service.js';

describe('vin decoder service', () => {
  it('normalizes and validates VINs', () => {
    assert.equal(normalizeVin(' 5fnrl5h60gb000001 '), '5FNRL5H60GB000001');
    assert.throws(() => normalizeVin('5FNRL5H60GB00000I'), /exclude I, O, and Q/);
  });

  it('decodes a VIN and caches the flat response', async () => {
    const db = fakeVinDecodeDb();
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount += 1;
      return Response.json({
        Results: [
          {
            Make: 'HONDA',
            Model: 'Odyssey',
            Trim: 'EX-L',
            BodyClass: 'Minivan',
            DriveType: '4x2',
            EngineCylinders: '6',
            FuelTypePrimary: 'Gasoline',
            ErrorCode: '0',
            ErrorText: '0 - VIN decoded clean. Check Digit (9th position) is correct'
          }
        ]
      });
    };

    const live = await decodeVin(db, '5fnrl5h60gb000001', 2016, '2026-08-27T00:00:00.000Z', fetcher);
    const cached = await decodeVin(db, '5FNRL5H60GB000001', 2016, '2026-08-28T00:00:00.000Z', fetcher);

    assert.equal(live.source, 'live');
    assert.equal(cached.source, 'cache');
    assert.equal(fetchCount, 1);
    assert.equal(live.decode.make, 'HONDA');
    assert.equal(live.decode.model, 'Odyssey');
    assert.equal(cached.decode.decodedAt, '2026-08-27T00:00:00.000Z');
  });

  it('decodes VINs for a saved search and reports cache hits', async () => {
    const db = fakeVinDecodeDb([{ vin: '5FNRL5H60GB000001', year: 2016 }]);
    let fetchCount = 0;
    const fetcher = async () => {
      fetchCount += 1;
      return Response.json({ Results: [{ Make: 'HONDA', Model: 'Odyssey' }] });
    };

    const live = await decodeSavedSearchVins(db, 'family-replacement-vehicle', '2026-08-27T00:00:00.000Z', fetcher);
    const cached = await decodeSavedSearchVins(db, 'family-replacement-vehicle', '2026-08-28T00:00:00.000Z', fetcher);

    assert.equal(fetchCount, 1);
    assert.deepEqual(live, {
      searchId: 'family-replacement-vehicle',
      candidateCount: 1,
      decodedCount: 1,
      cachedCount: 0,
      failed: []
    });
    assert.equal(cached.decodedCount, 0);
    assert.equal(cached.cachedCount, 1);
  });
});

function fakeVinDecodeDb(searchRows: Array<{ vin: string; year: number | null }> = []): D1Database {
  const rows = new Map<string, Record<string, unknown>>();

  return {
    prepare: (sql: string) => ({
      bind: (...values: unknown[]) => ({
        first: async () => rows.get(String(values[0])) ?? null,
        run: async () => {
          rows.set(String(values[0]), {
            vin: values[0],
            model_year: values[1],
            make: values[2],
            model: values[3],
            trim: values[4],
            body_class: values[5],
            drive_type: values[6],
            engine_cylinders: values[7],
            fuel_type_primary: values[8],
            error_code: values[9],
            error_text: values[10],
            raw_json: values[11],
            decoded_at: values[12]
          });
          return { success: true };
        },
        all: async () => ({ results: searchRows })
      }),
      first: async () => null,
      run: async () => ({ success: true }),
      all: async () => ({ results: searchRows })
    })
  } as unknown as D1Database;
}
