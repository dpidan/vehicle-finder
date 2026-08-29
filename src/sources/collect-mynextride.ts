import { cypressMynextrideSeeds } from './mynextride-seeds.js';
import { mynextrideSource } from './mynextride-source.js';

const listings = await mynextrideSource.collect({
  sellerSeeds: cypressMynextrideSeeds,
  collectedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      source: mynextrideSource.name,
      listingCount: listings.length,
      listings: listings.map((listing) => ({
        title: listing.title,
        price: listing.price,
        mileage: listing.mileage,
        seller: listing.seller?.name,
        url: listing.url
      }))
    },
    null,
    2
  )
);
