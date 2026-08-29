import { familySearchDefaults } from '../domain/search-config.js';
import { cypressDealerSitemapSeeds } from './dealer-sitemap-seeds.js';
import { dealerSitemapSource } from './dealer-sitemap-source.js';

const listings = await dealerSitemapSource.collect({
  sellerSeeds: cypressDealerSitemapSeeds,
  searches: [
    {
      id: familySearchDefaults.id,
      userId: familySearchDefaults.userId,
      name: familySearchDefaults.name,
      enabled: true,
      config: familySearchDefaults,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  collectedAt: new Date().toISOString()
});

console.log(
  JSON.stringify(
    {
      source: dealerSitemapSource.name,
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
