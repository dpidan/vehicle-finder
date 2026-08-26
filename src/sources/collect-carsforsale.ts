import { cypressCarsforsaleDealerSeeds } from './cypress-dealer-seeds.js';
import { carsforsaleSource } from './carsforsale-source.js';

const listings = await carsforsaleSource.collect({
  sellerSeeds: cypressCarsforsaleDealerSeeds,
  collectedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      source: carsforsaleSource.name,
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
