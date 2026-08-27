import type { ListingChanges, SearchEvaluationSummary, StaleListingSummary } from './search-service.js';

export interface MonitoringSummary {
  searchId: string;
  since: string;
  staleBefore: string;
  changes: ListingChanges;
  staleListings: StaleListingSummary[];
  thresholdMatches: SearchEvaluationSummary[];
}

export function isIsoDateTime(value: string | undefined): value is string {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

export function filterThresholdMatches(
  evaluations: SearchEvaluationSummary[],
  minimumVehicleScore: number | undefined,
  minimumDealScore: number | undefined
): SearchEvaluationSummary[] {
  return minimumVehicleScore === undefined && minimumDealScore === undefined
    ? []
    : evaluations.filter(
        (evaluation) =>
          (minimumVehicleScore === undefined || evaluation.vehicleScore >= minimumVehicleScore) &&
          (minimumDealScore === undefined || evaluation.dealScore >= minimumDealScore)
      );
}

export function formatMonitoringDigest(searchName: string, summary: MonitoringSummary): string {
  const lines = [
    `${searchName} monitoring digest`,
    `Window since: ${summary.since}`,
    `Stale before: ${summary.staleBefore}`,
    '',
    `New listings: ${summary.changes.newListings.length}`,
    ...summary.changes.newListings.map((listing) => `- ${listing.title} ${formatPrice(listing.currentPrice)} ${listing.url}`.trim()),
    '',
    `Price drops: ${summary.changes.priceDrops.length}`,
    ...summary.changes.priceDrops.map((listing) =>
      `- ${listing.title} ${formatPrice(listing.previousPrice)} -> ${formatPrice(listing.currentPrice)} ${listing.url}`.trim()
    ),
    '',
    `Stale listings: ${summary.staleListings.length}`,
    ...summary.staleListings.map((listing) => `- ${listing.title} last seen ${listing.lastSeenAt} ${listing.url}`),
    '',
    `Score threshold matches: ${summary.thresholdMatches.length}`,
    ...summary.thresholdMatches.map(
      (evaluation) =>
        `- ${evaluation.listing.title} vehicle ${evaluation.vehicleScore}, deal ${evaluation.dealScore} ${evaluation.listing.url}`
    )
  ];

  return `${lines.join('\n')}\n`;
}

function formatPrice(price: { amount: number } | undefined): string {
  return price ? `$${price.amount.toLocaleString('en-US')}` : 'unknown price';
}
