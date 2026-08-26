import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { collectSampleListings, sampleListingSource } from './sample-source.js';

describe('sample listing source', () => {
  it('returns normalized fixture listings', async () => {
    const listings = await collectSampleListings('2026-08-25T15:00:00.000Z');

    assert.equal(sampleListingSource.access, 'manual-import');
    assert.equal(listings.length, 3);
    assert.equal(listings[0]?.source.name, 'sample fixtures');
    assert.equal(listings[0]?.capturedAt, '2026-08-25T15:00:00.000Z');
    assert.deepEqual(
      listings.map((listing) => `${listing.vehicle.make} ${listing.vehicle.model}`),
      ['Honda Odyssey', 'Honda Pilot', 'Toyota Sienna']
    );
    assert.ok(listings.every((listing) => listing.evidence && listing.evidence.length > 0));
  });
});
