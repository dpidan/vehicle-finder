import { familySearchDefaults } from '../domain/search-config.js';
import { collectSampleListings } from '../sources/sample-source.js';
import { rankListingsForSearch } from './rank-listings.js';

const rankedListings = rankListingsForSearch(
  familySearchDefaults,
  await collectSampleListings(new Date().toISOString())
);

console.log(
  JSON.stringify(
    {
      searchId: familySearchDefaults.id,
      rankedListings: rankedListings.map((ranked, index) => ({
        rank: index + 1,
        title: ranked.listing.title,
        price: ranked.listing.price,
        mileage: ranked.listing.mileage,
        vehicleScore: ranked.vehicleScore,
        dealScore: ranked.dealScore,
        flags: ranked.flags,
        factors: ranked.factors
      }))
    },
    null,
    2
  )
);
