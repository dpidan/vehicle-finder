import { cypressGotGoodCarsSeeds } from './gotgoodcars-seeds.js';
import { gotGoodCarsSource } from './gotgoodcars-source.js';

const listings = await gotGoodCarsSource.collect({
  sellerSeeds: cypressGotGoodCarsSeeds,
  collectedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      source: gotGoodCarsSource.name,
      listingCount: listings.length,
      listings: listings.map((listing) => ({
        title: listing.title,
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
