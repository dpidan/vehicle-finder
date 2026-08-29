import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maxVisibleGotGoodCarsPage, parseGotGoodCarsInventory } from './gotgoodcars-source.js';

describe('parseGotGoodCarsInventory', () => {
  it('normalizes GotGoodCars inventory cards with detail URLs and photos', () => {
    const listings = parseGotGoodCarsInventory(
      `
        <div class="listing-vehicles-card inventory-card-1">
          <a href="/vehicles/12148980-2022-Audi-Q7/"><div class="title-holder"><h4 class="vehicle-title">2022 Audi Q7 Premium Plus Quattro</h4></div></a>
          <p class="vehicle-stock"><span>Stock ID :</span><span>D009971</span></p>
          <img class="inventory-image" src="https://cdn.example/12148980_0.jpg">
          <div class="price-holder"><p class="display-price">$26,000</p></div>
          <li class="icon-info-item"><span>84,831 Mi</span></li>
          <li class="icon-info-item"><img src="/inventory-factory-color-icon.svg"><span> Mythos Black Metallic - Black</span></li>
          <a href="/vehicles/12148980-2022-Audi-Q7/" class="skew-button v12-button listing-button">View Details</a>
        </div>
      `,
      { name: 'Uptown Imports', type: 'dealer', inventoryUrl: 'https://uptownimports.gotgoodcars.com/active-inventory/' },
      '2026-08-29T12:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.source.name, 'GotGoodCars dealer inventory');
    assert.equal(listings[0]?.sourceListingId, 'D009971');
    assert.equal(listings[0]?.vehicle.year, 2022);
    assert.equal(listings[0]?.vehicle.make, 'Audi');
    assert.equal(listings[0]?.vehicle.model, 'Q7 Premium Plus Quattro');
    assert.equal(listings[0]?.price?.amount, 26000);
    assert.equal(listings[0]?.mileage, 84831);
    assert.equal(listings[0]?.exteriorColor, 'Mythos Black Metallic');
    assert.equal(listings[0]?.photoUrls?.[0], 'https://cdn.example/12148980_0.jpg');
    assert.equal(listings[0]?.url, 'https://uptownimports.gotgoodcars.com/vehicles/12148980-2022-Audi-Q7/');
  });

  it('reads the highest visible pagination page', () => {
    assert.equal(
      maxVisibleGotGoodCarsPage(`
        <a class="page-numbers" href="https://example.test/active-inventory/?paged=2">2</a>
        <a class="page-numbers" href="https://example.test/active-inventory/?paged=3">3</a>
      `),
      3
    );
  });

  it('does not parse title MSRP text as the listing price', () => {
    const listings = parseGotGoodCarsInventory(
      `
        <div class="listing-vehicles-card inventory-card-1">
          <a href="/vehicles/12173975-2017-Porsche-Panamera/"><div class="title-holder"><h4 class="vehicle-title">2017 Porsche Panamera 4S AWD - $120k MSRP!</h4></div></a>
          <p class="vehicle-stock"><span>Stock ID :</span><span>L123947</span></p>
          <div class="price-holder"><p class="display-price">$42,000</p></div>
          <li class="icon-info-item"><span>47,901 Mi</span></li>
          <a href="/vehicles/12173975-2017-Porsche-Panamera/" class="skew-button v12-button listing-button">View Details</a>
        </div>
      `,
      { name: 'Uptown Imports', type: 'dealer', inventoryUrl: 'https://uptownimports.gotgoodcars.com/active-inventory/' },
      '2026-08-29T12:00:00.000Z'
    );

    assert.equal(listings[0]?.price?.amount, 42000);
  });
});
