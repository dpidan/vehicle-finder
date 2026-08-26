import type { SellerSeed } from '../domain/entities.js';

export const cypressCarsforsaleDealerSeeds: SellerSeed[] = [
  {
    name: 'VSA MotorCars',
    type: 'dealer',
    websiteUrl: 'https://www.vsamotorcars.com',
    inventoryUrl: 'https://www.vsamotorcars.com/cars-for-sale',
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
    inventoryUrl: 'https://www.autolandoftexas.com/cars-for-sale',
    location: {
      label: '12001 Cypress N Houston Rd., Cypress, TX 77429',
      latitude: 29.9476,
      longitude: -95.5999
    }
  },
  {
    name: 'I 90 Motors',
    type: 'dealer',
    websiteUrl: 'https://www.i90motorstx.com',
    inventoryUrl: 'https://www.i90motorstx.com/suvs-for-sale-b100037'
  }
];
