import { cypressJsonLdSeeds } from './json-ld-seeds.js';
import { jsonLdSource } from './json-ld-source.js';

const listings = await jsonLdSource.collect({
  sellerSeeds: cypressJsonLdSeeds,
  collectedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      source: jsonLdSource.name,
      listingCount: listings.length,
      listings: listings.map((listing) => ({
        title: listing.title,
        vin: listing.vehicle.vin,
        price: listing.price,
        mileage: listing.mileage,
        exteriorColor: listing.exteriorColor,
        seller: listing.seller?.name,
        url: listing.url
      }))
    },
    null,
    2
  )
);
