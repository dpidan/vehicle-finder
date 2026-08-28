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
    assert.ok(ranked[0] && ranked[1] && ranked[0].dealScore >= ranked[1].dealScore);
    assert.ok(ranked[0]?.dealScore);
    assert.ok(ranked[0]?.vehicleScore);
    assert.ok(ranked[0]?.factors.some((factor) => factor.key === 'model-preference'));
    assert.ok(ranked[0]?.effectiveCost);
    assert.ok(ranked.some((listing) => listing.flags.includes('missing-maintenance-evidence')));
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

  it('scores effective purchase cost against the maintenance reserve', () => {
    const [ranked] = rankListingsForSearch(familySearchDefaults, [
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/expensive-sienna',
        title: '2016 Toyota Sienna',
        vehicle: { year: 2016, make: 'Toyota', model: 'Sienna', vin: '12345678901234567' },
        price: { amount: 16_500, currency: 'USD' },
        capturedAt: '2026-08-27T00:00:00.000Z'
      }
    ]);

    assert.deepEqual(ranked?.effectiveCost, {
      askingPrice: 16_500,
      maintenanceReserve: 800,
      maintenanceItems: [],
      maintenanceItemsTotal: 0,
      total: 17_300
    });
    assert.equal(ranked?.factors.find((factor) => factor.key === 'effective-purchase-cost')?.scoreImpact, -8);
    assert.ok(ranked?.flags.includes('effective-cost-over-budget'));
  });

  it('flags very cheap listings with missing transparency signals', () => {
    const [ranked] = rankListingsForSearch(familySearchDefaults, [
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/cheap-pilot',
        title: '2011 Honda Pilot',
        vehicle: { year: 2011, make: 'Honda', model: 'Pilot' },
        price: { amount: 5_500, currency: 'USD' },
        capturedAt: '2026-08-27T00:00:00.000Z'
      }
    ]);

    assert.ok(ranked?.flags.includes('suspiciously-low-price'));
  });

  it('adds explicit immediate maintenance items to effective cost', () => {
    const [ranked] = rankListingsForSearch(familySearchDefaults, [
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/brakes-and-tires',
        title: '2014 Honda Odyssey',
        vehicle: { year: 2014, make: 'Honda', model: 'Odyssey', vin: '12345678901234567' },
        price: { amount: 9_000, currency: 'USD' },
        rawDescription: 'Runs well but needs tires and brakes are worn.',
        capturedAt: '2026-08-27T00:00:00.000Z'
      }
    ]);

    assert.equal(ranked?.effectiveCost?.maintenanceItemsTotal, 1_400);
    assert.equal(ranked?.effectiveCost?.total, 11_200);
    assert.deepEqual(
      ranked?.effectiveCost?.maintenanceItems.map((item) => item.key),
      ['tires', 'brakes']
    );
    assert.ok(ranked?.flags.includes('immediate-maintenance-over-reserve'));
  });

  it('filters ranked listings to saved search parameters', () => {
    const ranked = rankListingsForSearch(familySearchDefaults, [
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/odyssey',
        title: '2014 Honda Odyssey',
        vehicle: { year: 2014, make: 'Honda', model: 'Odyssey', vin: '12345678901234567' },
        price: { amount: 9_000, currency: 'USD' },
        seller: { name: 'Test Dealer', type: 'dealer' },
        capturedAt: '2026-08-27T00:00:00.000Z'
      },
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/bmw',
        title: '2015 BMW X5',
        vehicle: { year: 2015, make: 'BMW', model: 'X5', vin: '12345678901234568' },
        price: { amount: 9_000, currency: 'USD' },
        seller: { name: 'Test Dealer', type: 'dealer' },
        capturedAt: '2026-08-27T00:00:00.000Z'
      },
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/high-price',
        title: '2016 Toyota Sienna',
        vehicle: { year: 2016, make: 'Toyota', model: 'Sienna', vin: '12345678901234569' },
        price: { amount: 22_000, currency: 'USD' },
        seller: { name: 'Test Dealer', type: 'dealer' },
        capturedAt: '2026-08-27T00:00:00.000Z'
      }
    ]);

    assert.deepEqual(
      ranked.map((listing) => listing.listing.title),
      ['2014 Honda Odyssey']
    );
  });

  it('scores exterior color as a soft preference when known', () => {
    const ranked = rankListingsForSearch(familySearchDefaults, [
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/silver',
        title: '2014 Honda Odyssey',
        vehicle: { year: 2014, make: 'Honda', model: 'Odyssey', vin: '12345678901234567' },
        price: { amount: 9_000, currency: 'USD' },
        exteriorColor: 'Silver',
        capturedAt: '2026-08-27T00:00:00.000Z'
      },
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/black',
        title: '2014 Honda Odyssey',
        vehicle: { year: 2014, make: 'Honda', model: 'Odyssey', vin: '12345678901234568' },
        price: { amount: 9_000, currency: 'USD' },
        exteriorColor: 'Black',
        capturedAt: '2026-08-27T00:00:00.000Z'
      }
    ]);

    assert.equal(ranked[0]?.listing.exteriorColor, 'Silver');
    assert.equal(ranked[0]?.factors.find((factor) => factor.key === 'exterior-color-preference')?.scoreImpact, 3);
    assert.equal(ranked[1]?.factors.find((factor) => factor.key === 'exterior-color-preference')?.scoreImpact, -4);
  });

  it('can exclude exterior colors only when source data is available', () => {
    const search = {
      ...familySearchDefaults,
      filters: {
        ...familySearchDefaults.filters,
        excludedExteriorColors: ['black']
      }
    };
    const ranked = rankListingsForSearch(search, [
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/no-color',
        title: '2014 Honda Odyssey',
        vehicle: { year: 2014, make: 'Honda', model: 'Odyssey', vin: '12345678901234567' },
        price: { amount: 9_000, currency: 'USD' },
        capturedAt: '2026-08-27T00:00:00.000Z'
      },
      {
        source: { name: 'test', access: 'manual-import' },
        url: 'https://example.test/black',
        title: '2014 Honda Odyssey',
        vehicle: { year: 2014, make: 'Honda', model: 'Odyssey', vin: '12345678901234568' },
        price: { amount: 9_000, currency: 'USD' },
        exteriorColor: 'Black',
        capturedAt: '2026-08-27T00:00:00.000Z'
      }
    ]);

    assert.deepEqual(
      ranked.map((listing) => listing.listing.url),
      ['https://example.test/no-color']
    );
  });
});
