import { cypressIseecarsSeeds } from './iseecars-seeds.js';
import { iseecarsSource } from './iseecars-source.js';

const listings = await iseecarsSource.collect({
  sellerSeeds: cypressIseecarsSeeds,
  collectedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      source: iseecarsSource.name,
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
