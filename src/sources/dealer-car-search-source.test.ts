import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDealerCarSearchInventory } from './dealer-car-search-source.js';

describe('parseDealerCarSearchInventory', () => {
  it('normalizes visible Dealer Car Search listing rows', () => {
    const listings = parseDealerCarSearchInventory(
      `
        <div class="i17r-vehicle">
          <a href="/vdp/12345/Used-2017-Toyota-Sienna-XLE-for-sale-in-Houston-TX">2017 Toyota Sienna XLE</a>
          <span>Price</span><span>$15,995</span>
          <span>Stock #: A1234</span>
          <span>Mileage:</span><span>109,421</span>
          <span>Drivetrain: FWD</span>
          <span>Transmission: Automatic</span>
          <span>Color: Silver</span>
          <span>VIN: 5TDYZ3DC1HS000001</span>
        </div>
      `,
      {
        name: 'Trade Lane Motors',
        type: 'dealer',
        inventoryUrl: 'https://www.tradelanemotors.com/newandusedcars?clearall=1'
      },
      '2026-08-26T12:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.source.access, 'structured-web');
    assert.equal(listings[0]?.sourceListingId, '5TDYZ3DC1HS000001');
    assert.equal(listings[0]?.vehicle.make, 'Toyota');
    assert.equal(listings[0]?.vehicle.model, 'Sienna XLE');
    assert.equal(listings[0]?.vehicle.vin, '5TDYZ3DC1HS000001');
    assert.equal(listings[0]?.price?.amount, 15995);
    assert.equal(listings[0]?.mileage, 109421);
    assert.equal(listings[0]?.exteriorColor, 'Silver');
    assert.equal(listings[0]?.url, 'https://www.tradelanemotors.com/vdp/12345/Used-2017-Toyota-Sienna-XLE-for-sale-in-Houston-TX');
    assert.equal(listings[0]?.evidence?.[0]?.url, listings[0]?.url);
  });

  it('normalizes text-only Dealer Car Search inventory rows', () => {
    const listings = parseDealerCarSearchInventory(
      `
        <main>
          <span>Retail</span><span>$11,500.00</span>
          <h3>2014 Mercedes-Benz M-Class ML350 4MATIC</h3>
          <div>Color: Gray</div>
          <div>Drive: RWD</div>
          <div>VIN: 4JGDA5JBXEA326574</div>
          <div>Mileage: 124,000</div>
          <span>Internet</span><span>$6,995.00</span>
          <h3>2011 Nissan Versa 1.6 S Plus</h3>
          <div>Color: White</div>
          <div>VIN: 3N1CN7AP1BL000001</div>
          <div>Mileage: 118,200</div>
        </main>
      `,
      {
        name: 'Mr. King and Mrs. Queens Auto Finance LLC',
        type: 'dealer',
        inventoryUrl: 'https://www.kingqueenauto.com/newandusedcars?clearall=1'
      },
      '2026-08-28T12:00:00.000Z'
    );

    assert.equal(listings.length, 2);
    assert.equal(listings[0]?.sourceListingId, '4JGDA5JBXEA326574');
    assert.equal(listings[0]?.price?.amount, 11500);
    assert.equal(listings[0]?.mileage, 124000);
    assert.equal(listings[0]?.exteriorColor, 'Gray');
    assert.equal(listings[0]?.url, 'https://www.kingqueenauto.com/newandusedcars?clearall=1');
    assert.equal(listings[1]?.sourceListingId, '3N1CN7AP1BL000001');
    assert.equal(listings[1]?.price?.amount, 6995);
  });
});
