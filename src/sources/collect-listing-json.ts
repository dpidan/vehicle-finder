import { listingJsonSource } from './listing-import-source.js';

const inventoryUrl = process.argv[2];

if (!inventoryUrl) {
  throw new Error('Usage: npm run collect:listing-json -- https://example.com/listings.json');
}

const listings = await listingJsonSource.collect({
  sellerSeeds: [{ name: 'JSON listing export', type: 'dealer', inventoryUrl }],
  collectedAt: new Date().toISOString()
});

console.log(JSON.stringify({ source: listingJsonSource.name, listingCount: listings.length, listings }, null, 2));
