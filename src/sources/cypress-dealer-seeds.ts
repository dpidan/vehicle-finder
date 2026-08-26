import type { SellerSeed } from '../domain/entities.js';

export const cypressCarsforsaleDealerSeeds: SellerSeed[] = [
  {
    name: 'VSA MotorCars',
    type: 'dealer',
    websiteUrl: 'https://www.vsamotorcars.com',
    inventoryUrl: 'https://www.carsforsale.com/used-car-dealer/vsa-motorcars-cypress-tx-d477384',
    location: {
      label: '12212 Cypress N. Houston RD, Cypress, TX 77429',
      latitude: 29.9479,
      longitude: -95.6033
    }
  },
  {
    name: 'Auto Land Of Texas',
    type: 'dealer',
    websiteUrl: 'https://www.autolandoftexas.com',
    inventoryUrl: 'https://www.carsforsale.com/used-car-dealer/auto-land-of-texas-cypress-tx-d647793',
    location: {
      label: '12001 Cypress N Houston Rd., Cypress, TX 77429',
      latitude: 29.9476,
      longitude: -95.5999
    }
  },
  {
    name: '501 Motors',
    type: 'dealer',
    websiteUrl: 'https://www.501motors.com',
    inventoryUrl: 'https://www.carsforsale.com/used-car-dealer/501-motors-cypress-tx-d737118',
    location: {
      label: 'Cypress, TX',
      latitude: 29.9697,
      longitude: -95.697
    }
  },
  {
    name: 'I 90 Motors',
    type: 'dealer',
    websiteUrl: 'https://www.i90motorstx.com',
    inventoryUrl: 'https://www.i90motorstx.com/suvs-for-sale-b100037'
  }
];
