import type { CollectionContext, ListingCandidate, ListingSource } from '../domain/entities.js';

const source = { name: 'sample fixtures', access: 'manual-import' } as const;

const sampleListings = [
  {
    sourceListingId: 'sample-2016-odyssey',
    url: 'https://example.test/sample-2016-odyssey',
    title: '2016 Honda Odyssey EX-L',
    status: 'active',
    vehicle: {
      vin: '5FNRL5H60GB000001',
      year: 2016,
      make: 'Honda',
      model: 'Odyssey',
      trim: 'EX-L'
    },
    seller: {
      name: 'Cypress Family Autos',
      type: 'dealer',
      websiteUrl: 'https://example.test/cypress-family-autos',
      location: {
        label: 'Cypress, TX',
        latitude: 29.9697,
        longitude: -95.697
      }
    },
    price: { amount: 12900, currency: 'USD' },
    mileage: 104000,
    titleStatus: 'clean',
    location: {
      label: 'Cypress, TX',
      latitude: 29.9697,
      longitude: -95.697
    },
    rawDescription: 'Clean title, timing belt service documented, power sliding doors work.',
    evidence: [{ label: 'sample listing page', url: 'https://example.test/sample-2016-odyssey', confidence: 0.8 }]
  },
  {
    sourceListingId: 'sample-2012-pilot',
    url: 'https://example.test/sample-2012-pilot',
    title: '2012 Honda Pilot EX-L',
    status: 'active',
    vehicle: {
      vin: '5FNYF3H50CB000001',
      year: 2012,
      make: 'Honda',
      model: 'Pilot',
      trim: 'EX-L'
    },
    seller: {
      name: 'Northwest Houston Motors',
      type: 'dealer',
      location: {
        label: 'Houston, TX',
        latitude: 29.981,
        longitude: -95.583
      }
    },
    price: { amount: 9900, currency: 'USD' },
    mileage: 137000,
    titleStatus: 'clean',
    location: {
      label: 'Houston, TX',
      latitude: 29.981,
      longitude: -95.583
    },
    rawDescription: 'Clean title, no service records shown. Verify oil consumption and timing belt history.',
    evidence: [{ label: 'sample listing page', url: 'https://example.test/sample-2012-pilot', confidence: 0.7 }]
  },
  {
    sourceListingId: 'sample-2015-sienna',
    url: 'https://example.test/sample-2015-sienna',
    title: '2015 Toyota Sienna XLE',
    status: 'active',
    vehicle: {
      vin: '5TDYK3DC0FS000001',
      year: 2015,
      make: 'Toyota',
      model: 'Sienna',
      trim: 'XLE'
    },
    seller: {
      name: 'Private seller',
      type: 'private',
      location: {
        label: 'Katy, TX',
        latitude: 29.7858,
        longitude: -95.8244
      }
    },
    price: { amount: 14900, currency: 'USD' },
    mileage: 93000,
    titleStatus: 'clean',
    location: {
      label: 'Katy, TX',
      latitude: 29.7858,
      longitude: -95.8244
    },
    rawDescription: 'One family owner, maintenance records available, inspection welcome.',
    evidence: [{ label: 'sample listing text', url: 'https://example.test/sample-2015-sienna', confidence: 0.75 }]
  }
] satisfies Array<Omit<ListingCandidate, 'source' | 'capturedAt'>>;

export const sampleListingSource: ListingSource = {
  name: source.name,
  access: source.access,
  collect: async (context) =>
    sampleListings.map((listing) => ({
      ...listing,
      source,
      capturedAt: context.collectedAt
    }))
};

export async function collectSampleListings(collectedAt: CollectionContext['collectedAt']): Promise<ListingCandidate[]> {
  return sampleListingSource.collect({ collectedAt });
}
