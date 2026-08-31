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
  },
  {
    name: 'CROWN AUTO',
    type: 'dealer',
    websiteUrl: 'https://www.mycrownauto.com',
    inventoryUrl: 'https://crownautoinc.gotgoodcars.com/all-inventory/?price%5B%5D=0&price%5B%5D=20000',
    location: {
      latitude: 30.0551,
      longitude: -95.5053,
      label: '5514 Louetta Rd, Spring, TX 77379'
    }
  }
];
