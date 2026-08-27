import type { ListingCandidate, ScoreFactor } from '../domain/entities.js';
import type { SavedSearchConfig } from '../domain/search-config.js';

export const SCORE_VERSION = 'sample-v1';

export interface RankedListing {
  listing: ListingCandidate;
  scoreVersion: typeof SCORE_VERSION;
  vehicleScore: number;
  dealScore: number;
  effectiveCost?: EffectiveCostEstimate;
  factors: ScoreFactor[];
  flags: string[];
}

export interface EffectiveCostEstimate {
  askingPrice: number;
  maintenanceReserve: number;
  maintenanceItems: MaintenanceItemEstimate[];
  maintenanceItemsTotal: number;
  total: number;
}

export interface MaintenanceItemEstimate {
  key: string;
  label: string;
  estimatedCost: number;
  matchedText: string;
}

const maintenancePatterns: Array<{
  key: string;
  label: string;
  estimatedCost: number;
  patterns: RegExp[];
}> = [
  { key: 'tires', label: 'Tires', estimatedCost: 800, patterns: [/\bneeds? (?:new )?tires?\b/, /\btires? (?:are )?(?:worn|bald)\b/] },
  { key: 'brakes', label: 'Brakes', estimatedCost: 600, patterns: [/\bneeds? (?:new )?brakes?\b/, /\bbrakes? (?:are )?(?:worn|squeaking)\b/] },
  { key: 'battery', label: 'Battery', estimatedCost: 250, patterns: [/\bneeds? (?:a )?(?:new )?battery\b/, /\bbattery (?:is )?(?:dead|bad|weak)\b/] },
  { key: 'windshield', label: 'Windshield', estimatedCost: 500, patterns: [/\bcracked windshield\b/, /\bneeds? (?:a )?(?:new )?windshield\b/] },
  { key: 'timing-belt', label: 'Timing belt service', estimatedCost: 1200, patterns: [/\btiming belt (?:is )?(?:due|needed)\b/, /\bneeds? timing belt\b/] },
  { key: 'check-engine-diagnostic', label: 'Check-engine diagnostic', estimatedCost: 200, patterns: [/\bcheck engine light\b/, /\bcel (?:is )?(?:on|illuminated)\b/] }
];

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
  if (hasSuspiciouslyLowPrice(search, listing)) {
    flags.push('suspiciously-low-price');
  }

  const effectiveCost = effectiveCostEstimate(search, listing);
  if (effectiveCost) {
    const impact = effectiveCostScoreImpact(search, effectiveCost.total);
    dealScore += impact;
    if (impact !== 0) {
      factors.push(factor('effective-purchase-cost', 'score.effectivePurchaseCost', impact));
    }
    if (search.budgets.absoluteMax && effectiveCost.total > search.budgets.absoluteMax) {
      flags.push('effective-cost-over-budget');
    }
    if (effectiveCost.maintenanceItemsTotal > (search.workflow?.immediateMaintenanceBudget ?? Number.POSITIVE_INFINITY)) {
      flags.push('immediate-maintenance-over-reserve');
      factors.push(factor('immediate-maintenance-over-reserve', 'score.immediateMaintenanceOverReserve', -6));
      dealScore -= 6;
    }
  }

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
    ...(effectiveCost ? { effectiveCost } : {}),
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

  if (price === undefined) {
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

function hasSuspiciouslyLowPrice(search: SavedSearchConfig, listing: ListingCandidate): boolean {
  const price = listing.price?.amount;
  const cashTarget = search.budgets.cashTarget;

  if (price === undefined || cashTarget === undefined || price > cashTarget * 0.6) {
    return false;
  }

  const description = listing.rawDescription?.toLowerCase() ?? '';
  const hasMaintenanceEvidence = description.includes('maintenance records') || description.includes('service documented');

  return !listing.vehicle.vin || !listing.titleStatus || !hasMaintenanceEvidence;
}

function effectiveCostEstimate(search: SavedSearchConfig, listing: ListingCandidate): EffectiveCostEstimate | undefined {
  const askingPrice = listing.price?.amount;
  const maintenanceReserve = search.workflow?.immediateMaintenanceBudget;
  const maintenanceItems = estimateMaintenanceItems(listing);
  const maintenanceItemsTotal = maintenanceItems.reduce((total, item) => total + item.estimatedCost, 0);

  if (askingPrice === undefined || maintenanceReserve === undefined) {
    return undefined;
  }

  return {
    askingPrice,
    maintenanceReserve,
    maintenanceItems,
    maintenanceItemsTotal,
    total: askingPrice + maintenanceReserve + maintenanceItemsTotal
  };
}

function estimateMaintenanceItems(listing: ListingCandidate): MaintenanceItemEstimate[] {
  const description = listing.rawDescription?.toLowerCase() ?? '';
  const items: MaintenanceItemEstimate[] = [];

  for (const candidate of maintenancePatterns) {
    const match = candidate.patterns.map((pattern) => description.match(pattern)?.[0]).find(Boolean);
    if (match) {
      items.push({
        key: candidate.key,
        label: candidate.label,
        estimatedCost: candidate.estimatedCost,
        matchedText: match
      });
    }
  }

  return items;
}

function effectiveCostScoreImpact(search: SavedSearchConfig, total: number): number {
  if (search.budgets.absoluteMax && total > search.budgets.absoluteMax) {
    return -8;
  }

  if (search.budgets.cashTarget && total <= search.budgets.cashTarget) {
    return 6;
  }

  if (search.budgets.stretchTarget && total <= search.budgets.stretchTarget) {
    return 3;
  }

  return 0;
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
