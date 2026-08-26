import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { manualImportToCandidate } from './manual-import.js';

describe('manualImportToCandidate', () => {
  it('normalizes pasted listing details into a listing candidate', () => {
    const candidate = manualImportToCandidate(
      {
        url: 'https://example.test/listing',
        title: '2015 Toyota Sienna XLE',
        year: 2015,
        make: 'Toyota',
        model: 'Sienna',
        price: 14900,
        mileage: 93000,
        titleStatus: 'clean',
        sellerName: 'Private seller',
        description: 'Maintenance records available.'
      },
      '2026-08-26T12:00:00.000Z'
    );

    assert.equal(candidate.source.name, 'manual import');
    assert.equal(candidate.vehicle.make, 'Toyota');
    assert.equal(candidate.price?.currency, 'USD');
    assert.equal(candidate.capturedAt, '2026-08-26T12:00:00.000Z');
    assert.equal(candidate.evidence?.[0]?.url, 'https://example.test/listing');
  });

  it('rejects missing required fields', () => {
    assert.throws(() => manualImportToCandidate({ url: '', title: 'Listing' }, '2026-08-26T12:00:00.000Z'));
  });
});
