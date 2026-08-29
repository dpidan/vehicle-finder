import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseJsonLdInventory } from './json-ld-source.js';

describe('parseJsonLdInventory', () => {
  it('normalizes generic vehicle JSON-LD records', () => {
    const listings = parseJsonLdInventory(
      `
        <script type="application/ld+json">
          {
            "@graph": [{
              "@type": "Vehicle",
              "@id": "vehicle-1",
              "url": "/details/used-2017-honda-odyssey/123",
              "name": "2017 Honda Odyssey EX-L",
              "brand": {"name": "Honda"},
              "model": "Odyssey",
              "vehicleModelDate": 2017,
              "vehicleIdentificationNumber": "5FNRL5H60HB000001",
              "mileageFromOdometer": {"value": "118203"},
              "color": "White",
              "image": ["/photo.jpg"],
              "offers": {
                "price": "14450",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              }
            }]
          }
        </script>
      `,
      {
        name: 'Sample Dealer',
        type: 'dealer',
        inventoryUrl: 'https://example.com/inventory'
      },
      '2026-08-29T00:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.source.name, 'generic JSON-LD vehicle page');
    assert.equal(listings[0]?.sourceListingId, '5FNRL5H60HB000001');
    assert.equal(listings[0]?.vehicle.year, 2017);
    assert.equal(listings[0]?.vehicle.make, 'Honda');
    assert.equal(listings[0]?.vehicle.model, 'Odyssey');
    assert.equal(listings[0]?.price?.amount, 14450);
    assert.equal(listings[0]?.mileage, 118203);
    assert.equal(listings[0]?.exteriorColor, 'White');
    assert.equal(listings[0]?.url, 'https://example.com/details/used-2017-honda-odyssey/123');
    assert.deepEqual(listings[0]?.photoUrls, ['https://example.com/photo.jpg']);
  });
});
