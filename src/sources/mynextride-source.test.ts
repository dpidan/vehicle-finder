import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maxVisibleMynextridePage, parseMynextrideInventory } from './mynextride-source.js';

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
});
