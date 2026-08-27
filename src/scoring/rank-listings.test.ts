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

  it('applies model-year risk impacts with explainable factors', () => {
    const [preferred] = rankListingsForSearch(familySearchDefaults, [
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/sienna',
        title: '2015 Toyota Sienna',
        vehicle: { year: 2015, make: 'Toyota', model: 'Sienna' },
        risks: [
          {
            id: 'risk-preferred',
            make: 'Toyota',
            model: 'Sienna',
            yearStart: 2015,
            yearEnd: 2016,
            rating: 'preferred',
            issue: 'Preferred year.',
            category: 'body',
            severity: 3,
            inspectFor: [],
            evidenceIds: []
          }
        ],
        capturedAt: '2026-08-27T00:00:00.000Z'
      }
    ]);
    const [caution] = rankListingsForSearch(familySearchDefaults, [
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/odyssey',
        title: '2013 Honda Odyssey',
        vehicle: { year: 2013, make: 'Honda', model: 'Odyssey' },
        risks: [
          {
            id: 'risk-caution',
            make: 'Honda',
            model: 'Odyssey',
            yearStart: 2011,
            yearEnd: 2013,
            rating: 'caution',
            issue: 'Verify VCM history.',
            category: 'engine',
            severity: 7,
            inspectFor: [],
            evidenceIds: []
          }
        ],
        capturedAt: '2026-08-27T00:00:00.000Z'
      }
    ]);

    assert.equal(preferred?.factors.find((factor) => factor.key === 'model-year-risk')?.scoreImpact, 8);
    assert.equal(caution?.factors.find((factor) => factor.key === 'model-year-risk')?.scoreImpact, -10);
    assert.ok(caution?.flags.includes('model-year-risk'));
  });
});
