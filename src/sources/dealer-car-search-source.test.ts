import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDealerCarSearchInventory } from './dealer-car-search-source.js';

describe('parseDealerCarSearchInventory', () => {
  it('normalizes visible Dealer Car Search listing rows', () => {
    const listings = parseDealerCarSearchInventory(
      `
        <div>
          <a>2017 Toyota Sienna XLE</a>
          <span>Price</span><span>$15,995</span>
          <span>Stock #: A1234</span>
          <span>Mileage:</span><span>109,421</span>
          <span>Drivetrain: FWD</span>
          <span>Transmission: Automatic</span>
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
  });
});
