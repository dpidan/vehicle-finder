import { listingCsvSource } from './listing-import-source.js';

const inventoryUrl = process.argv[2];

if (!inventoryUrl) {
  throw new Error('Usage: npm run collect:listing-csv -- https://example.com/listings.csv');
}

const listings = await listingCsvSource.collect({
  sellerSeeds: [{ name: 'CSV listing export', type: 'dealer', inventoryUrl }],
  collectedAt: new Date().toISOString()
});

console.log(JSON.stringify({ source: listingCsvSource.name, listingCount: listings.length, listings }, null, 2));
