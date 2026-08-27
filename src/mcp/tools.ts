import { filterThresholdMatches, formatMonitoringDigest, isIsoDateTime, type MonitoringSummary } from '../services/monitoring-service.js';
import {
  getListingDetail,
  getListingDisposition,
  getSavedSearch,
  listLatestSearchEvaluations,
  listListingChanges,
  listSavedSearches,
  listStaleListings,
  rankPersistedListingsForSavedSearch
} from '../services/search-service.js';

export const mcpToolNames = [
  'list_saved_searches',
  'get_saved_search',
  'get_ranked_listings',
  'get_listing_detail',
  'get_listing_snapshots',
  'get_latest_evaluations',
  'get_listing_disposition',
  'get_monitoring_summary',
  'get_monitoring_digest'
] as const;

export type McpToolName = (typeof mcpToolNames)[number];

export interface McpToolDefinition {
  name: McpToolName;
  description: string;
  requiredArguments: string[];
}

export type McpToolResult =
  | { ok: true; data: unknown }
  | { ok: false; error: 'unknown-tool' | 'invalid-arguments' | 'not-found'; message?: string };

export const mcpTools: McpToolDefinition[] = [
  { name: 'list_saved_searches', description: 'List saved vehicle searches.', requiredArguments: [] },
  { name: 'get_saved_search', description: 'Fetch one saved search and its configuration.', requiredArguments: ['searchId'] },
  { name: 'get_ranked_listings', description: 'Rank persisted listings for one saved search.', requiredArguments: ['searchId'] },
  { name: 'get_listing_detail', description: 'Fetch listing detail and recent snapshots.', requiredArguments: ['listingId'] },
  { name: 'get_listing_snapshots', description: 'Fetch recent snapshots for one listing.', requiredArguments: ['listingId'] },
  { name: 'get_latest_evaluations', description: 'Fetch latest saved-search listing evaluations.', requiredArguments: ['searchId'] },
  { name: 'get_listing_disposition', description: 'Fetch workflow state for one listing.', requiredArguments: ['searchId', 'listingId'] },
  { name: 'get_monitoring_summary', description: 'Fetch recent monitoring signals for one saved search.', requiredArguments: ['searchId', 'since', 'staleBefore'] },
  { name: 'get_monitoring_digest', description: 'Fetch a plain text monitoring digest.', requiredArguments: ['searchId', 'since', 'staleBefore'] }
];

export async function callMcpTool(db: D1Database, name: string, args: Record<string, unknown> = {}): Promise<McpToolResult> {
  if (!isMcpToolName(name)) {
    return { ok: false, error: 'unknown-tool' };
  }

  switch (name) {
    case 'list_saved_searches':
      return ok({ searches: await listSavedSearches(db) });
    case 'get_saved_search':
      return withSearch(db, stringArg(args, 'searchId'), (search) => ok({ search }));
    case 'get_ranked_listings':
      return withSearch(db, stringArg(args, 'searchId'), async (search) =>
        ok({ searchId: search.id, rankedListings: await rankPersistedListingsForSavedSearch(db, search) })
      );
    case 'get_listing_detail': {
      const listingId = stringArg(args, 'listingId');
      if (!listingId) return invalidArguments();
      const detail = await getListingDetail(db, listingId);
      return detail ? ok(detail) : notFound();
    }
    case 'get_listing_snapshots': {
      const listingId = stringArg(args, 'listingId');
      if (!listingId) return invalidArguments();
      const detail = await getListingDetail(db, listingId);
      return detail ? ok({ listingId, snapshots: detail.snapshots }) : notFound();
    }
    case 'get_latest_evaluations':
      return withSearch(db, stringArg(args, 'searchId'), async (search) =>
        ok({ searchId: search.id, evaluations: await listLatestSearchEvaluations(db, search.id) })
      );
    case 'get_listing_disposition': {
      const searchId = stringArg(args, 'searchId');
      const listingId = stringArg(args, 'listingId');
      if (!searchId || !listingId) return invalidArguments();
      return withSearch(db, searchId, async (search) =>
        ok({ disposition: await getListingDisposition(db, search.id, listingId) })
      );
    }
    case 'get_monitoring_summary':
      return withMonitoringWindow(db, args, async (search, since, staleBefore) => {
        const [changes, staleListings, evaluations] = await Promise.all([
          listListingChanges(db, search.id, since),
          listStaleListings(db, search.id, staleBefore),
          listLatestSearchEvaluations(db, search.id)
        ]);
        const summary: MonitoringSummary = {
          searchId: search.id,
          since,
          staleBefore,
          changes,
          staleListings,
          thresholdMatches: filterThresholdMatches(
            evaluations,
            search.config.notifications.minimumVehicleScore,
            search.config.notifications.minimumDealScore
          )
        };

        return ok(summary);
      });
    case 'get_monitoring_digest':
      return withMonitoringWindow(db, args, async (search, since, staleBefore) => {
        const summary = await callMcpTool(db, 'get_monitoring_summary', { searchId: search.id, since, staleBefore });
        return summary.ok
          ? ok({ text: formatMonitoringDigest(search.name, summary.data as MonitoringSummary) })
          : summary;
      });
  }
}

function isMcpToolName(name: string): name is McpToolName {
  return (mcpToolNames as readonly string[]).includes(name);
}

async function withSearch(
  db: D1Database,
  searchId: string | undefined,
  read: (search: NonNullable<Awaited<ReturnType<typeof getSavedSearch>>>) => Promise<McpToolResult> | McpToolResult
): Promise<McpToolResult> {
  if (!searchId) {
    return invalidArguments();
  }

  const search = await getSavedSearch(db, searchId);
  return search ? read(search) : notFound();
}

async function withMonitoringWindow(
  db: D1Database,
  args: Record<string, unknown>,
  read: (
    search: NonNullable<Awaited<ReturnType<typeof getSavedSearch>>>,
    since: string,
    staleBefore: string
  ) => Promise<McpToolResult>
): Promise<McpToolResult> {
  const since = stringArg(args, 'since');
  const staleBefore = stringArg(args, 'staleBefore');

  if (!isIsoDateTime(since) || !isIsoDateTime(staleBefore)) {
    return invalidArguments();
  }

  return withSearch(db, stringArg(args, 'searchId'), (search) => read(search, since, staleBefore));
}

function stringArg(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function ok(content: unknown): McpToolResult {
  return { ok: true, data: content };
}

function invalidArguments(): McpToolResult {
  return { ok: false, error: 'invalid-arguments' };
}

function notFound(): McpToolResult {
  return { ok: false, error: 'not-found' };
}
