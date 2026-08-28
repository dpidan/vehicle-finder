import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { cypressDealerCarSearchSeeds } from './sources/dealer-car-search-seeds.js';

describe('data readiness', () => {
  it('keeps migrations ordered for first D1 population', () => {
    assert.deepEqual(
      readdirSync('migrations')
        .filter((file) => file.endsWith('.sql'))
        .sort(),
      [
        '0001_initial.sql',
        '0002_listing_photos.sql',
        '0003_vin_decodes.sql',
        '0004_vehicle_recalls.sql',
        '0005_listing_exterior_color.sql',
        '0006_source_feeds.sql'
      ]
    );
  });

  it('has local reset and inspection scripts', () => {
    assert.match(readFileSync('scripts/db-reset-local.sql', 'utf8'), /DROP TABLE IF EXISTS users/);
    assert.match(readFileSync('scripts/db-inspection.sql', 'utf8'), /SELECT COUNT\(\*\) AS listings FROM listings/);
    assert.match(readFileSync('scripts/db-inspection.sql', 'utf8'), /SELECT COUNT\(\*\) AS source_feeds FROM source_feeds/);
  });

  it('seeds the initial family search shape', () => {
    const seed = readFileSync('seeds/0001_family_search.sql', 'utf8');

    for (const expected of [
      'family-replacement-vehicle',
      'Happy Ln, Cypress, TX',
      '"radiusMiles":25',
      '"cashTarget":10000',
      '"stretchTarget":15000',
      '"Honda"',
      '"Toyota"',
      '"Odyssey"',
      '"Pilot"',
      '"Sienna"',
      '"CR-V"',
      'risk-honda-odyssey-2011-2013-vcm',
      'risk-honda-pilot-2012-2013-vcm',
      'risk-toyota-sienna-2015-2016-sliding-doors',
      'feed-dealer-car-search-trade-lane-motors',
      'feed-cargurus-toyo-financial-group',
      "'paused'"
    ]) {
      assert.match(seed, new RegExp(escapeRegExp(expected)));
    }

    assert.match(seed, /ON CONFLICT\(id\) DO UPDATE SET/);
  });

  it('has an inspectable live dealer seed', () => {
    assert.ok(cypressDealerCarSearchSeeds.length >= 2);

    for (const seed of cypressDealerCarSearchSeeds) {
      assert.equal(seed.type, 'dealer');
      assert.match(seed.inventoryUrl ?? '', /^https:\/\/.+/);

      if (seed.location) {
        assert.ok(seed.location.latitude);
        assert.ok(seed.location.longitude);
      }
    }
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
