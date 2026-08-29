import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseIseecarsInventory } from './iseecars-source.js';

describe('parseIseecarsInventory', () => {
  it('normalizes iSeeCars Vehicle JSON-LD records', () => {
    const listings = parseIseecarsInventory(
      `
        <script type="application/ld+json">
          {"@context":"http://schema.org/","@type":"Vehicle","vehicleIdentificationNumber":"WVWBN7AN8EE519479","name":"2014 Volkswagen CC R-Line - 95,230 mi","brand":"Volkswagen","model":"CC","mileageFromOdometer":95230,"color":"Black","offers":{"@type":"Offer","priceCurrency":"USD","price":6495,"availability":"http://schema.org/InStock"},"sku":"100812533181"}
        </script>
        <div data-listing-url="https://www.iseecars.com/view/listing?redirectUrl=https%3A%2F%2Fexample.test%2Fvehicle%2FWVWBN7AN8EE519479"></div>
      `,
      {
        name: 'Ride Motors LLC',
        type: 'dealer',
        websiteUrl: 'https://www.ridemotorsllc.com',
        inventoryUrl: 'https://www.iseecars.com/dealer-3450550-ride-motors-llc-in-cypress-tx'
      },
      '2026-08-28T12:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.source.access, 'structured-web');
    assert.equal(listings[0]?.sourceListingId, 'WVWBN7AN8EE519479');
    assert.equal(listings[0]?.vehicle.year, 2014);
    assert.equal(listings[0]?.vehicle.make, 'Volkswagen');
    assert.equal(listings[0]?.vehicle.model, 'CC');
    assert.equal(listings[0]?.vehicle.vin, 'WVWBN7AN8EE519479');
    assert.equal(listings[0]?.price?.amount, 6495);
    assert.equal(listings[0]?.mileage, 95230);
    assert.equal(listings[0]?.exteriorColor, 'Black');
    assert.equal(listings[0]?.status, 'active');
    assert.equal(
      listings[0]?.url,
      'https://www.iseecars.com/view/listing?redirectUrl=https%3A%2F%2Fexample.test%2Fvehicle%2FWVWBN7AN8EE519479'
    );
  });
});
