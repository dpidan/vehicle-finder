import { cypressDealerComSeeds } from './dealer-com-seeds.js';
import { dealerComSource } from './dealer-com-source.js';

const listings = await dealerComSource.collect({
  sellerSeeds: cypressDealerComSeeds,
  collectedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      source: dealerComSource.name,
      listingCount: listings.length,
      listings: listings.map((listing) => ({
        title: listing.title,
        price: listing.price,
        mileage: listing.mileage,
        exteriorColor: listing.exteriorColor,
        vin: listing.vehicle.vin,
        seller: listing.seller?.name,
        url: listing.url
      }))
    },
    null,
    2
  )
);
