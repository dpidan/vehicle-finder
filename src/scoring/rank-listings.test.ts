import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { familySearchDefaults } from '../domain/search-config.js';
import { collectSampleListings } from '../sources/sample-source.js';
import { rankListingsForSearch, SCORE_VERSION } from './rank-listings.js';

describe('rankListingsForSearch', () => {
  it('ranks sample listings with explainable factors', async () => {
    const listings = await collectSampleListings('2026-08-25T16:00:00.000Z');
    const ranked = rankListingsForSearch(familySearchDefaults, listings);

    assert.equal(ranked.length, 3);
    assert.equal(ranked[0]?.scoreVersion, SCORE_VERSION);
    assert.equal(ranked[0]?.listing.title, '2015 Toyota Sienna XLE');
    assert.ok(ranked[0]?.dealScore);
    assert.ok(ranked[0]?.vehicleScore);
    assert.ok(ranked[0]?.factors.some((factor) => factor.key === 'model-preference'));
    assert.ok(ranked[2]?.flags.includes('missing-maintenance-evidence'));
  });
});
