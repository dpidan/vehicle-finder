import { cypressCargurusDealerSeeds } from './cargurus-seeds.js';
import { cargurusSource } from './cargurus-source.js';

const listings = await cargurusSource.collect({
  sellerSeeds: cypressCargurusDealerSeeds,
  collectedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      source: cargurusSource.name,
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
