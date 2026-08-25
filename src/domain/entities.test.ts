import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { familySearchDefaults } from './search-config.js';
import type {
  Listing,
  ListingDisposition,
  ListingSource,
  ModelYearRisk,
  SavedSearch,
  SearchEvaluation,
  Vehicle
} from './entities.js';

describe('domain entity relationships', () => {
  it('keeps canonical listing facts global and search state search-specific', () => {
    const vehicle: Vehicle = {
      id: 'vehicle-1',
      vin: '5FNRL5H60GB000001',
      year: 2016,
      make: 'Honda',
      model: 'Odyssey',
      createdAt: '2026-08-24T12:00:00.000Z',
      updatedAt: '2026-08-24T12:00:00.000Z'
    };

    const listing: Listing = {
      id: 'listing-1',
      vehicleId: vehicle.id,
      source: { name: 'manual import', access: 'manual-import' },
      url: 'https://example.test/listing-1',
      title: '2016 Honda Odyssey EX-L',
      status: 'active',
      price: { amount: 12900, currency: 'USD' },
      mileage: 104000,
      titleStatus: 'clean',
      firstSeenAt: '2026-08-24T12:00:00.000Z',
      lastSeenAt: '2026-08-24T12:00:00.000Z',
      createdAt: '2026-08-24T12:00:00.000Z',
      updatedAt: '2026-08-24T12:00:00.000Z'
    };

    const searchA = savedSearch('family-search-a');
    const searchB = savedSearch('family-search-b');
    const evaluationA = evaluation('evaluation-a', searchA.id, listing.id, vehicle.id, 82, 91);
    const evaluationB = evaluation('evaluation-b', searchB.id, listing.id, vehicle.id, 74, 78);
    const dispositionA: ListingDisposition = {
      id: 'disposition-a',
      savedSearchId: searchA.id,
      listingId: listing.id,
      state: 'favorite',
      nextAction: { type: 'ask-maintenance-records' },
      updatedAt: '2026-08-24T12:30:00.000Z'
    };

    assert.equal(evaluationA.listingId, evaluationB.listingId);
    assert.equal(evaluationA.vehicleId, evaluationB.vehicleId);
    assert.notEqual(evaluationA.savedSearchId, evaluationB.savedSearchId);
    assert.equal(dispositionA.listingId, listing.id);
    assert.equal(dispositionA.savedSearchId, searchA.id);
  });

  it('allows source adapters to return normalized candidates with evidence-backed risks', async () => {
    const source: ListingSource = {
      name: 'manual import',
      access: 'manual-import',
      collect: async (context) => [
        {
          source: { name: 'manual import', access: 'manual-import' },
          url: 'https://example.test/listing-2',
          title: '2012 Honda Pilot EX-L',
          vehicle: {
            vin: '5FNYF3H50CB000001',
            year: 2012,
            make: 'Honda',
            model: 'Pilot',
            trim: 'EX-L'
          },
          seller: {
            name: 'Example Motors',
            type: 'dealer'
          },
          price: { amount: 10900, currency: 'USD' },
          mileage: 118000,
          titleStatus: 'clean',
          capturedAt: context.collectedAt,
          evidence: [{ label: 'listing page', url: 'https://example.test/listing-2', confidence: 0.8 }]
        }
      ]
    };
    const risk: ModelYearRisk = {
      id: 'risk-honda-pilot-2012-vcm',
      make: 'Honda',
      model: 'Pilot',
      yearStart: 2012,
      yearEnd: 2013,
      rating: 'caution',
      issue: 'VCM/oil-consumption or piston-ring history needs verification',
      category: 'engine',
      severity: 7,
      inspectFor: ['misfire history', 'oil consumption', 'documented piston-ring remediation'],
      evidenceIds: ['evidence-risk-1']
    };

    const candidates = await source.collect({
      search: familySearchDefaults,
      collectedAt: '2026-08-25T12:00:00.000Z'
    });

    assert.equal(candidates[0]?.vehicle.vin, '5FNYF3H50CB000001');
    assert.equal(candidates[0]?.capturedAt, '2026-08-25T12:00:00.000Z');
    assert.equal(risk.rating, 'caution');
    assert.deepEqual(risk.evidenceIds, ['evidence-risk-1']);
  });
});

function savedSearch(id: string): SavedSearch {
  return {
    id,
    userId: familySearchDefaults.userId,
    name: id,
    enabled: true,
    config: { ...familySearchDefaults, id, name: id },
    createdAt: '2026-08-24T12:00:00.000Z',
    updatedAt: '2026-08-24T12:00:00.000Z'
  };
}

function evaluation(
  id: string,
  savedSearchId: string,
  listingId: string,
  vehicleId: string,
  vehicleScore: number,
  dealScore: number
): SearchEvaluation {
  return {
    id,
    savedSearchId,
    listingId,
    vehicleId,
    scoreVersion: 'v1',
    vehicleScore,
    dealScore,
    factors: [],
    flags: [],
    evaluatedAt: '2026-08-24T12:00:00.000Z'
  };
}
