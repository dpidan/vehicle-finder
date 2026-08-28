import { cypressDealerComSeeds } from './dealer-com-seeds.js';
import { analyzeDealerComInventory, dealerComSource } from './dealer-com-source.js';

const seed = cypressDealerComSeeds[0];
const listings = await dealerComSource.collect({
  sellerSeeds: cypressDealerComSeeds,
  collectedAt: new Date().toISOString()
});
const initialPageAnalysis =
  seed?.inventoryUrl &&
  analyzeDealerComInventory(
    await fetch(seed.inventoryUrl, {
      headers: { 'user-agent': 'vehicle-finder/0.1 low-frequency family vehicle search' }
    }).then((response) => response.text())
  );

console.log(
  JSON.stringify(
    {
      source: dealerComSource.name,
      initialPageAnalysis,
      listingCount: listings.length,
      shownListingCount: Math.min(listings.length, 25),
      listings: listings.slice(0, 25).map((listing) => ({
        title: listing.title,
        price: listing.price,
        mileage: listing.mileage,
        exteriorColor: listing.exteriorColor,
        vin: listing.vehicle.vin,
        seller: listing.seller?.name,
        url: listing.url
      })),
      omittedListingCount: Math.max(0, listings.length - 25)
    },
    null,
    2
  )
);
