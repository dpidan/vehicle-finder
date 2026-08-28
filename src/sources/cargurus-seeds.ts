import type { SellerSeed } from '../domain/entities.js';

export const cypressCargurusDealerSeeds: SellerSeed[] = [
  {
    name: 'Toyo Financial Group',
    type: 'dealer',
    websiteUrl: 'https://www.toyofg.com',
    inventoryUrl: 'https://www.cargurus.com/Cars/m-Toyo-Financial-Group-sp357911',
    location: {
      label: '22226 Northwest Fwy, Cypress, TX 77429',
      latitude: 29.935,
      longitude: -95.6469
    }
  },
  {
    name: 'VSA Motorcars',
    type: 'dealer',
    websiteUrl: 'https://www.vsamotorcars.com',
    inventoryUrl: 'https://www.cargurus.com/Cars/m-VSA-Motorcars-sp354407',
    location: {
      label: '12212 Cypress N. Houston RD #1, Cypress, TX 77429',
      latitude: 29.9809,
      longitude: -95.655
    }
  }
];
