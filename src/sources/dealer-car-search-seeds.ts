import type { SellerSeed } from '../domain/entities.js';

export const cypressDealerCarSearchSeeds: SellerSeed[] = [
  {
    name: 'Trade Lane Motors',
    type: 'dealer',
    websiteUrl: 'https://www.tradelanemotors.com',
    inventoryUrl: 'https://www.tradelanemotors.com/newandusedcars?clearall=1',
    location: {
      label: 'Cypress, TX',
      latitude: 29.9697,
      longitude: -95.697
    }
  }
];
