import type { ListingCandidate, ScoreFactor } from '../domain/entities.js';
import type { SavedSearchConfig } from '../domain/search-config.js';

export const SCORE_VERSION = 'sample-v1';

export interface RankedListing {
  listing: ListingCandidate;
  scoreVersion: typeof SCORE_VERSION;
  vehicleScore: number;
  dealScore: number;
  factors: ScoreFactor[];
  flags: string[];
}

export function rankListingsForSearch(search: SavedSearchConfig, listings: ListingCandidate[]): RankedListing[] {
  return listings
    .map((listing) => scoreListing(search, listing))
    .sort((a, b) => b.dealScore - a.dealScore || b.vehicleScore - a.vehicleScore);
}

function scoreListing(search: SavedSearchConfig, listing: ListingCandidate): RankedListing {
  const factors: ScoreFactor[] = [];
  const flags: string[] = [];
  let vehicleScore = 50;
  let dealScore = 50;

  const preferredModel = search.preferences.modelPreferences.find(
    (preference) =>
      equalName(preference.make, listing.vehicle.make) &&
      equalName(preference.model, listing.vehicle.model) &&
      (!preference.minYear || !listing.vehicle.year || listing.vehicle.year >= preference.minYear) &&
      (!preference.maxYear || !listing.vehicle.year || listing.vehicle.year <= preference.maxYear)
  );

  if (preferredModel) {
    const impact = Math.round((preferredModel.weight ?? 0.5) * 18);
    vehicleScore += impact;
    factors.push(factor('model-preference', 'score.modelPreference', impact));
  }

  const riskImpact = modelYearRiskImpact(listing);
  if (riskImpact !== 0) {
    vehicleScore += riskImpact;
    factors.push(factor('model-year-risk', 'score.modelYearRisk', riskImpact));
  }
  if (listing.risks?.some((risk) => risk.rating === 'caution' || risk.rating === 'avoid-unless-remediated')) {
    flags.push('model-year-risk');
  }

  if (listing.titleStatus && search.filters.titleStatuses?.includes(listing.titleStatus)) {
    vehicleScore += 10;
    factors.push(factor('clean-title', 'score.cleanTitle', 10));
  } else if (listing.titleStatus) {
    vehicleScore -= 30;
    dealScore -= 20;
    flags.push('title-status-mismatch');
    factors.push(factor('title-status-mismatch', 'score.titleStatusMismatch', -30));
  }

  const mileageImpact = mileageScoreImpact(search, listing);
  vehicleScore += mileageImpact;
  factors.push(factor('mileage-fit', 'score.mileageFit', mileageImpact));

  const description = listing.rawDescription?.toLowerCase() ?? '';
  if (description.includes('maintenance records') || description.includes('service documented')) {
    vehicleScore += 12;
    dealScore += 5;
    factors.push(factor('maintenance-evidence', 'score.maintenanceEvidence', 12));
  } else if (description.includes('no service records')) {
    vehicleScore -= 8;
    flags.push('missing-maintenance-evidence');
    factors.push(factor('missing-maintenance-evidence', 'score.missingMaintenanceEvidence', -8));
  }

  const priceImpact = priceScoreImpact(search, listing);
  dealScore += priceImpact;
  factors.push(factor('budget-fit', 'score.budgetFit', priceImpact));

  if (!listing.vehicle.vin) {
    vehicleScore -= 10;
    dealScore -= 5;
    flags.push('missing-vin');
    factors.push(factor('missing-vin', 'score.missingVin', -10));
  }

  dealScore += Math.round((clamp(vehicleScore) - 50) * 0.3);

  return {
    listing,
    scoreVersion: SCORE_VERSION,
    vehicleScore: clamp(vehicleScore),
    dealScore: clamp(dealScore),
    factors,
    flags
  };
}

function mileageScoreImpact(search: SavedSearchConfig, listing: ListingCandidate): number {
  const mileage = listing.mileage;
  const targets = search.preferences.mileageTargets;

  if (!mileage || !targets) {
    return 0;
  }

  if (targets.stretchIdealMax && mileage <= targets.stretchIdealMax) {
    return 12;
  }

  if (targets.cashIdealMax && mileage <= targets.cashIdealMax) {
    return 8;
  }

  if (targets.cashSoftMax && mileage <= targets.cashSoftMax) {
    return 2;
  }

  return -8;
}

function priceScoreImpact(search: SavedSearchConfig, listing: ListingCandidate): number {
  const price = listing.price?.amount;

  if (!price) {
    return -5;
  }

  if (search.budgets.cashTarget && price <= search.budgets.cashTarget) {
    return 18;
  }

  if (search.budgets.stretchTarget && price <= search.budgets.stretchTarget) {
    return 8;
  }

  if (search.budgets.absoluteMax && price <= search.budgets.absoluteMax) {
    return -2;
  }

  return -20;
}

function modelYearRiskImpact(listing: ListingCandidate): number {
  const risks = listing.risks ?? [];

  if (risks.some((risk) => risk.rating === 'avoid-unless-remediated')) return -18;
  if (risks.some((risk) => risk.rating === 'caution')) return -10;
  if (risks.some((risk) => risk.rating === 'preferred')) return 8;
  if (risks.some((risk) => risk.rating === 'good')) return 5;

  return 0;
}

function factor(key: string, messageKey: string, scoreImpact: number): ScoreFactor {
  return { key, messageKey, scoreImpact };
}

function equalName(a: string | undefined, b: string | undefined): boolean {
  return a?.toLowerCase() === b?.toLowerCase();
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
