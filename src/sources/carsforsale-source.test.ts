import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCarsforsaleInventory } from './carsforsale-source.js';

describe('parseCarsforsaleInventory', () => {
  it('normalizes visible Carsforsale-powered listing cards', () => {
    const listings = parseCarsforsaleInventory(
      `
        <div>
          <a>2018 Honda Accord EX-L w/Navi</a>
          <a>Apply Now</a>
          <p>Price</p>
          <p>$16,750</p>
          <p>Mileage</p>
          <p>124,588</p>
        </div>
        <div>
          <a>2016 Toyota Corolla S Plus</a>
          <p>Price</p>
          <p>$10,995</p>
          <p>Mileage</p>
          <p>132,412</p>
        </div>
      `,
      {
        name: 'VSA MotorCars',
        type: 'dealer',
        inventoryUrl: 'https://www.vsamotorcars.com/cars-for-sale'
      },
      '2026-08-26T12:00:00.000Z'
    );

    assert.equal(listings.length, 2);
    assert.equal(listings[0]?.source.access, 'structured-web');
    assert.equal(listings[0]?.seller?.name, 'VSA MotorCars');
    assert.equal(listings[0]?.vehicle.make, 'Honda');
    assert.equal(listings[0]?.price?.amount, 16750);
    assert.equal(listings[0]?.mileage, 124588);
    assert.equal(listings[1]?.vehicle.model, 'Corolla S Plus');
  });

  it('normalizes Carsforsale profile cards with inline price and mileage', () => {
    const listings = parseCarsforsaleInventory(
      `
        <article>
          <h2>2017 Honda Odyssey EX-L</h2>
          <span>$14,450</span>
          <span>118,203 miles</span>
        </article>
      `,
      {
        name: '501 Motors',
        type: 'dealer',
        inventoryUrl: 'https://www.carsforsale.com/used-car-dealer/501-motors-cypress-tx-d737118'
      },
      '2026-08-26T12:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.price?.amount, 14450);
    assert.equal(listings[0]?.mileage, 118203);
  });
});
