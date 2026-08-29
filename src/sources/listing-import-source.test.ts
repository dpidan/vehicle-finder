import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseListingCsvImport, parseListingJsonImport } from './listing-import-source.js';

describe('listing import sources', () => {
  it('normalizes JSON listing exports', () => {
    const listings = parseListingJsonImport(
      JSON.stringify([
        {
          url: 'https://example.com/odyssey',
          title: '2016 Honda Odyssey EX-L',
          year: 2016,
          make: 'Honda',
          model: 'Odyssey',
          vin: '5FNRL5H60GB000001',
          price: 12900,
          mileage: 104000,
          exteriorColor: 'White',
          sellerName: 'Export Dealer',
          sellerType: 'dealer'
        }
      ]),
      '2026-08-29T00:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.source.name, 'listing JSON import');
    assert.equal(listings[0]?.vehicle.vin, '5FNRL5H60GB000001');
    assert.equal(listings[0]?.price?.amount, 12900);
    assert.equal(listings[0]?.mileage, 104000);
    assert.equal(listings[0]?.exteriorColor, 'White');
  });

  it('normalizes CSV listing exports with quoted values', () => {
    const listings = parseListingCsvImport(
      [
        'url,title,year,make,model,price,mileage,sellerName,sellerType,description',
        '"https://example.com/pilot","2014 Honda Pilot EX-L",2014,Honda,Pilot,"$10,500","132,100","CSV Dealer",dealer,"Clean title, local trade"'
      ].join('\n'),
      '2026-08-29T00:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.source.name, 'listing CSV import');
    assert.equal(listings[0]?.vehicle.year, 2014);
    assert.equal(listings[0]?.price?.amount, 10500);
    assert.equal(listings[0]?.mileage, 132100);
    assert.equal(listings[0]?.seller?.name, 'CSV Dealer');
  });
});
