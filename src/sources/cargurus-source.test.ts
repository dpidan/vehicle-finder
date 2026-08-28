import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCargurusInventory } from './cargurus-source.js';

describe('parseCargurusInventory', () => {
  it('normalizes visible CarGurus dealer profile listings', () => {
    const listings = parseCargurusInventory(
      `
        <script>{"listingId":450893176}</script>
        <div>Year: 2024 Make: Nissan Model: Altima Body type: Sedan Drivetrain: Front-Wheel Drive Exterior color: Brilliant Silver Metallic Mileage: 85,297 Stock #: 302845 VIN: 1N4BL4DV2RN302845</div>
        <h4>2024 Nissan Altima</h4>
        <div>2.5 SV FWD</div>
        <div>$15,050</div>
      `,
      {
        name: 'Toyo Financial Group',
        type: 'dealer',
        inventoryUrl: 'https://www.cargurus.com/Cars/m-Toyo-Financial-Group-sp357911'
      },
      '2026-08-28T12:00:00.000Z'
    );

    assert.equal(listings.length, 1);
    assert.equal(listings[0]?.source.access, 'structured-web');
    assert.equal(listings[0]?.sourceListingId, '1N4BL4DV2RN302845');
    assert.equal(listings[0]?.vehicle.make, 'Nissan');
    assert.equal(listings[0]?.vehicle.model, 'Altima');
    assert.equal(listings[0]?.vehicle.vin, '1N4BL4DV2RN302845');
    assert.equal(listings[0]?.price?.amount, 15050);
    assert.equal(listings[0]?.mileage, 85297);
    assert.equal(listings[0]?.exteriorColor, 'Brilliant Silver Metallic');
    assert.equal(listings[0]?.url, 'https://www.cargurus.com/Cars/m-Toyo-Financial-Group-sp357911?listingId=450893176');
  });
});
