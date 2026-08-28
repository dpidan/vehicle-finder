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
  },
  {
    name: 'Future Cars',
    type: 'dealer',
    websiteUrl: 'https://www.futurecarus.com',
    inventoryUrl: 'https://www.futurecarus.com/newandusedcars?clearall=1'
  },
  {
    name: 'Texaz Motors',
    type: 'dealer',
    websiteUrl: 'https://texazmotors.com',
    inventoryUrl: 'https://texazmotors.com/newandusedcars?clearall=1'
  },
  {
    name: 'CarCafe LLC',
    type: 'dealer',
    websiteUrl: 'https://www.carcafe-tx.com',
    inventoryUrl: 'https://www.carcafe-tx.com/newandusedcars?clearall=1'
  },
  {
    name: 'C.P. Auto Sales',
    type: 'dealer',
    websiteUrl: 'https://www.cpautosale.com',
    inventoryUrl: 'https://www.cpautosale.com/newandusedcars?clearall=1'
  }
];
