import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseDealerComInventory } from './dealer-com-source.js';

describe('parseDealerComInventory', () => {
  it('normalizes embedded Dealer.com WIS inventory records', () => {
    const listings = parseDealerComInventory(
      `
        <script>
          DDC.WS.state['ws-inv-data']['inventory-data-bus1'] = {"WIS":{"inventory":[{
            "uuid":"vehicle-1",
            "vin":"1n4al3ap8en358262",
            "year":2014,
            "make":"Nissan",
            "model":"Altima",
            "trim":"2.5 S",
            "title":["Pre-Owned 2014 Nissan","Altima 2.5 S Sedan FWD"],
            "link":"/used/Nissan/2014-Nissan-Altima-1f930acdac18341f4df4ff9ec44e89dc.htm",
            "status":"live",
            "trackingPricing":{"salePrice":"5899","internetPrice":"$5,899"},
            "trackingAttributes":[
              {"name":"exteriorColor","value":"Brilliant Silver Metallic"},
              {"name":"odometer","value":"98,123"}
            ]
          }]}};
        </script>
      `,
      {
        name: 'Autostrade',
        type: 'dealer',
        websiteUrl: 'https://www.autostradetx.net',
        inventoryUrl: 'https://www.autostradetx.net/used-inventory/index.htm'
      },
      '2026-08-28T12:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.source.access, 'structured-web');
    assert.equal(listings[0]?.sourceListingId, '1N4AL3AP8EN358262');
    assert.equal(listings[0]?.vehicle.year, 2014);
    assert.equal(listings[0]?.vehicle.make, 'Nissan');
    assert.equal(listings[0]?.vehicle.model, 'Altima');
    assert.equal(listings[0]?.vehicle.trim, '2.5 S');
    assert.equal(listings[0]?.vehicle.vin, '1N4AL3AP8EN358262');
    assert.equal(listings[0]?.price?.amount, 5899);
    assert.equal(listings[0]?.mileage, 98123);
    assert.equal(listings[0]?.exteriorColor, 'Brilliant Silver Metallic');
    assert.equal(listings[0]?.status, 'active');
    assert.equal(
      listings[0]?.url,
      'https://www.autostradetx.net/used/Nissan/2014-Nissan-Altima-1f930acdac18341f4df4ff9ec44e89dc.htm'
    );
    assert.equal(listings[0]?.evidence?.[0]?.url, listings[0]?.url);
  });

  it('normalizes multiple embedded Dealer.com inventory pages', () => {
    const listings = parseDealerComInventory(
      `
        <script>DDC.WS.state['ws-inv-data']['inventory-data-bus1'] = {"WIS":{"pageInfo":{"totalCount":2,"pageSize":1,"pageStart":0},"inventory":[{"vin":"5FNRL6H70JB005771","year":2018,"make":"Honda","model":"Odyssey","title":["2018 Honda Odyssey EX-L"],"link":"/used/Honda/Odyssey.htm","trackingPricing":{"salePrice":"17890"},"trackingAttributes":[{"name":"odometer","value":"110,842"}]}]}};</script>
        <script>DDC.WS.state['ws-inv-data']['inventory-data-bus1'] = {"WIS":{"pageInfo":{"totalCount":2,"pageSize":1,"pageStart":1},"inventory":[{"vin":"5TDJKRFH3FS206418","year":2015,"make":"Toyota","model":"Highlander","title":["2015 Toyota Highlander XLE V6"],"link":"/used/Toyota/Highlander.htm","trackingPricing":{"salePrice":"17990"},"trackingAttributes":[{"name":"odometer","value":"98,128"}]}]}};</script>
      `,
      {
        name: 'Autostrade',
        type: 'dealer',
        websiteUrl: 'https://www.autostradetx.net',
        inventoryUrl: 'https://www.autostradetx.net/used-inventory/index.htm'
      },
      '2026-08-28T12:00:00.000Z'
    );

    assert.equal(listings.length, 2);
    assert.equal(listings[0]?.vehicle.model, 'Odyssey');
    assert.equal(listings[1]?.vehicle.model, 'Highlander');
  });
});
