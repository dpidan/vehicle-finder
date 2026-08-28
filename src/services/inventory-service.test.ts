import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ListingCandidate } from '../domain/entities.js';
import { importListingCandidates } from './inventory-service.js';

describe('importListingCandidates', () => {
  it('deduplicates vehicles by VIN and updates existing listings', async () => {
    const db = fakeInventoryDb({
      vehicleByVin: { id: 'vehicle-existing' },
      listingBySource: { id: 'listing-existing', vehicle_id: 'vehicle-existing' }
    });

    const result = await importListingCandidates(db, [
      listingCandidate({
        price: { amount: 7890, currency: 'USD' },
        mileage: 163707
      })
    ]);

    assert.deepEqual(result, {
      candidateCount: 1,
      insertedListings: 0,
      updatedListings: 1,
      snapshotCount: 1
    });
    assert.equal(db.insertedVehicles.length, 0);
    assert.equal(db.updatedVehicles.length, 1);
    assert.equal(db.updatedListings.length, 1);
    assert.equal(db.snapshots.length, 1);
  });

  it('reuses the existing vehicle for VIN-less listing updates', async () => {
    const db = fakeInventoryDb({
      listingBySource: { id: 'listing-existing', vehicle_id: 'vehicle-existing' }
    });
    const candidate = listingCandidate({
      vehicle: { year: 2018, make: 'Ford', model: 'Expedition XLT' },
      url: 'https://www.example.test/listing/ford-expedition'
    });
    delete candidate.sourceListingId;
    delete candidate.mileage;

    const result = await importListingCandidates(db, [candidate]);

    assert.equal(result.updatedListings, 1);
    assert.equal(db.insertedVehicles.length, 0);
    assert.equal(db.updatedVehicles.length, 1);
    assert.equal(db.updatedVehicles[0]?.at(-1), 'vehicle-existing');
  });

  it('inserts new vehicles, sellers, listings, and snapshots', async () => {
    const db = fakeInventoryDb();

    const result = await importListingCandidates(db, [listingCandidate()]);

    assert.equal(result.insertedListings, 1);
    assert.equal(result.snapshotCount, 1);
    assert.equal(db.insertedVehicles.length, 1);
    assert.equal(db.insertedSellers.length, 1);
    assert.equal(db.insertedListings.length, 1);
    assert.equal(db.snapshots.length, 1);
  });

  it('stores listing exterior color and photo URLs on listings and snapshots', async () => {
    const db = fakeInventoryDb();

    await importListingCandidates(db, [listingCandidate({ exteriorColor: 'Silver', photoUrls: ['https://example.test/photo.jpg'] })]);

    assert.equal(db.insertedListings[0]?.[12], 'Silver');
    assert.equal(db.insertedListings[0]?.[13], JSON.stringify(['https://example.test/photo.jpg']));
    assert.equal(db.snapshots[0]?.[6], 'Silver');
    assert.equal(db.snapshots[0]?.[7], JSON.stringify(['https://example.test/photo.jpg']));
  });
});

function listingCandidate(overrides: Partial<ListingCandidate> = {}): ListingCandidate {
  return {
    source: { name: 'dealer car search seeded dealer', access: 'structured-web' },
    sourceListingId: '5FNRL5H95DB028656',
    url: 'https://www.tradelanemotors.com/newandusedcars?clearall=1',
    title: '2013 Honda Odyssey',
    status: 'active',
    vehicle: {
      vin: '5FNRL5H95DB028656',
      year: 2013,
      make: 'Honda',
      model: 'Odyssey'
    },
    seller: {
      name: 'Trade Lane Motors',
      type: 'dealer',
      websiteUrl: 'https://www.tradelanemotors.com'
    },
    price: { amount: 7890, currency: 'USD' },
    mileage: 163707,
    capturedAt: '2026-08-26T12:00:00.000Z',
    evidence: [{ label: 'Trade Lane Motors inventory page', url: 'https://www.tradelanemotors.com/newandusedcars?clearall=1' }],
    ...overrides
  };
}

function fakeInventoryDb(
  existing: { vehicleByVin?: { id: string }; seller?: { id: string }; listingBySource?: { id: string; vehicle_id: string } } = {}
) {
  const state = {
    insertedVehicles: [] as unknown[][],
    updatedVehicles: [] as unknown[][],
    insertedSellers: [] as unknown[][],
    updatedSellers: [] as unknown[][],
    insertedListings: [] as unknown[][],
    updatedListings: [] as unknown[][],
    snapshots: [] as unknown[][]
  };

  return {
    ...state,
    prepare: (sql: string) => ({
      bind: (...values: unknown[]) => ({
        first: async () => {
          if (sql.includes('FROM vehicles WHERE vin =')) return existing.vehicleByVin ?? null;
          if (sql.includes('FROM sellers')) return existing.seller ?? null;
          if (sql.includes('FROM listings')) return existing.listingBySource ?? null;
          return null;
        },
        run: async () => {
          if (sql.startsWith('INSERT INTO vehicles')) state.insertedVehicles.push(values);
          if (sql.startsWith('UPDATE vehicles')) state.updatedVehicles.push(values);
          if (sql.startsWith('INSERT INTO sellers')) state.insertedSellers.push(values);
          if (sql.startsWith('UPDATE sellers')) state.updatedSellers.push(values);
          if (sql.startsWith('INSERT INTO listings')) state.insertedListings.push(values);
          if (sql.startsWith('UPDATE listings')) state.updatedListings.push(values);
          if (sql.startsWith('INSERT INTO listing_snapshots')) state.snapshots.push(values);
          return { success: true };
        }
      })
    })
  } as unknown as D1Database & typeof state;
}
