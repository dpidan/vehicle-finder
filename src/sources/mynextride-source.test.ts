import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { enrichMynextrideListing, maxVisibleMynextridePage, parseMynextrideInventory } from './mynextride-source.js';

describe('parseMynextrideInventory', () => {
  it('normalizes static MyNextRide cards with detail URLs', () => {
    const listings = parseMynextrideInventory(
      `
        <div class="m-3" wire:key="7634029">
          <div class="card search-car-card bg-dark-blue border-0 rounded-0 h-100 cursor-pointer"
            onclick="linkClick('https://www.mynextride.com/cars-for-sale/7634029/2025-toyota-camry-cypress-tx', event)">
            <p class="p-3 m-0 font-weight-bold title-md">2025 Toyota Camry XSE</p>
            <p class="text-light-blue title-md p-3 mb-1">Call for Pricing
              <span class="float-right">36,188 mi</span>
            </p>
          </div>
        </div>
        <ul class="pagination">
          <button type="button" class="page-link" wire:click="gotoPage(2)">2</button>
          <button type="button" class="page-link" wire:click="gotoPage(5)">5</button>
        </ul>
      `,
      {
        name: 'Auto Land of Texas',
        type: 'dealer',
        inventoryUrl: 'https://www.mynextride.com/dealers/42/auto-land-of-texas-cypress-tx/inventory'
      },
      '2026-08-29T12:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.sourceListingId, '7634029');
    assert.equal(listings[0]?.vehicle.year, 2025);
    assert.equal(listings[0]?.vehicle.make, 'Toyota');
    assert.equal(listings[0]?.vehicle.model, 'Camry');
    assert.equal(listings[0]?.vehicle.trim, 'XSE');
    assert.equal(listings[0]?.mileage, 36188);
    assert.equal(listings[0]?.url, 'https://www.mynextride.com/cars-for-sale/7634029/2025-toyota-camry-cypress-tx');
  });

  it('reads the highest visible pagination page', () => {
    assert.equal(maxVisibleMynextridePage('<button wire:click="gotoPage(2)">2</button><button wire:click="gotoPage(5)">5</button>'), 5);
  });

  it('enriches matching listings from detail-page facts', () => {
    const [candidate] = parseMynextrideInventory(
      `
        <div class="m-3" wire:key="5099351">
          <div class="card search-car-card" onclick="linkClick('https://www.mynextride.com/cars-for-sale/5099351/2019-ford-edge-cypress-tx', event)">
            <p class="p-3 m-0 font-weight-bold title-md">2019 Ford Edge SEL</p>
            <span class="float-right">68,558 mi</span>
          </div>
        </div>
      `,
      { name: 'Auto Land of Texas', type: 'dealer' },
      '2026-08-29T12:00:00.000Z'
    );

    const enriched = enrichMynextrideListing(
      candidate!,
      `
        <h3 class="vdp-title">2019 Ford Edge SEL</h3>
        <p class="py-1 px-2 font-weight-bold m-1 d-flex align-items-center">
          <span class="pr-4 mr-auto">VIN</span>
          <span class="text-right text-white font-weight-normal">2FMPK4J91KBB60883</span>
        </p>
        <p class="py-1 px-2 font-weight-bold m-1 d-flex align-items-center">
          <span class="pr-4 mr-auto">Exterior Color</span>
          <span class="text-right text-white font-weight-normal">Maroon</span>
        </p>
        <p class="py-1 px-2 font-weight-bold m-1 d-flex align-items-center">
          <span class="pr-4 mr-auto">Mileage</span>
          <span class="text-right text-white font-weight-normal">68,558</span>
        </p>
      `
    );

    assert.equal(enriched.vehicle.vin, '2FMPK4J91KBB60883');
    assert.equal(enriched.exteriorColor, 'Maroon');
    assert.equal(enriched.mileage, 68558);
    assert.match(enriched.rawDescription ?? '', /VIN: 2FMPK4J91KBB60883/);
  });
});
