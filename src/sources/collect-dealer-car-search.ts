import { cypressDealerCarSearchSeeds } from './dealer-car-search-seeds.js';
import { dealerCarSearchSource } from './dealer-car-search-source.js';

const listings = await dealerCarSearchSource.collect({
  sellerSeeds: cypressDealerCarSearchSeeds,
  collectedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      source: dealerCarSearchSource.name,
      listingCount: listings.length,
      listings: listings.map((listing) => ({
        title: listing.title,
        price: listing.price,
        mileage: listing.mileage,
        vin: listing.vehicle.vin,
        seller: listing.seller?.name,
        url: listing.url
      }))
    },
    null,
    2
  )
);
