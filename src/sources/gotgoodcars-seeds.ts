import type { SellerSeed } from '../domain/entities.js';

export const cypressGotGoodCarsSeeds: SellerSeed[] = [
  {
    name: 'Uptown Imports',
    type: 'dealer',
    websiteUrl: 'https://uptownimports.gotgoodcars.com',
    inventoryUrl: 'https://uptownimports.gotgoodcars.com/active-inventory/',
    location: {
      latitude: 30.0636,
      longitude: -95.4246,
      label: '1208 Spring Cypress Rd, Spring, TX 77373'
    }
  }
];
