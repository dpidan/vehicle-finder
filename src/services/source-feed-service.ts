import type { ListingCandidate, ListingSource, SellerSeed, SourceAdapterKey, SourceFeed, SourceFeedStatus } from '../domain/entities.js';
import { cargurusSource } from '../sources/cargurus-source.js';
import { dealerCarSearchSource } from '../sources/dealer-car-search-source.js';
import { cypressDealerCarSearchSeeds } from '../sources/dealer-car-search-seeds.js';

type SourceAdapterMap = Partial<Record<SourceAdapterKey, ListingSource>>;

const sourceAdapters: SourceAdapterMap = {
  'dealer-car-search': dealerCarSearchSource,
  cargurus: cargurusSource
};

interface SourceFeedRow {
  id: string;
  seller_id: string | null;
  name: string;
  adapter_key: SourceAdapterKey;
  access: SourceFeed['access'];
  status: SourceFeedStatus;
  inventory_url: string;
  website_url: string | null;
  collection_priority: number;
  last_collected_at: string | null;
  last_status: string | null;
  last_error: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  seller_name: string | null;
  seller_type: SellerSeed['type'] | null;
  seller_phone: string | null;
  seller_website_url: string | null;
  seller_latitude: number | null;
  seller_longitude: number | null;
  seller_location_label: string | null;
}

export interface CollectionRunResult {
  feeds: SourceFeed[];
  candidates: ListingCandidate[];
  collectedCountByAdapter: Partial<Record<SourceAdapterKey, number>>;
}

export async function collectActiveSourceFeeds(db: D1Database, collectedAt: string): Promise<CollectionRunResult> {
  const feeds = await listSourceFeeds(db, 'active');
  const activeFeeds = feeds.length ? feeds : fallbackDealerCarSearchFeeds(collectedAt);
  const candidates: ListingCandidate[] = [];
  const collectedCountByAdapter: Partial<Record<SourceAdapterKey, number>> = {};

  for (const [adapterKey, adapterFeeds] of groupFeedsByAdapter(activeFeeds)) {
    const adapter = sourceAdapters[adapterKey];

    if (!adapter) {
      continue;
    }

    const collected = await adapter.collect({
      sellerSeeds: adapterFeeds.map(feedToSellerSeed),
      collectedAt
    });
    candidates.push(...collected);
    collectedCountByAdapter[adapterKey] = collected.length;
  }

  return { feeds: activeFeeds, candidates, collectedCountByAdapter };
}

export async function listSourceFeeds(db: D1Database, status?: SourceFeedStatus): Promise<SourceFeed[]> {
  try {
    const query = `
      SELECT source_feeds.*, sellers.name AS seller_name, sellers.type AS seller_type, sellers.phone AS seller_phone,
             sellers.website_url AS seller_website_url, sellers.latitude AS seller_latitude,
             sellers.longitude AS seller_longitude, sellers.location_label AS seller_location_label
      FROM source_feeds
      LEFT JOIN sellers ON sellers.id = source_feeds.seller_id
      ${status ? 'WHERE source_feeds.status = ?' : ''}
      ORDER BY source_feeds.collection_priority, source_feeds.name
    `;
    const statement = db.prepare(query);
    const rows = status
      ? await statement.bind(status).all<SourceFeedRow>()
      : await statement.all<SourceFeedRow>();

    return (rows.results ?? []).map(rowToSourceFeed);
  } catch (error) {
    if (String(error).includes('source_feeds')) {
      return [];
    }

    throw error;
  }
}

function groupFeedsByAdapter(feeds: SourceFeed[]): Array<[SourceAdapterKey, SourceFeed[]]> {
  const grouped = new Map<SourceAdapterKey, SourceFeed[]>();

  for (const feed of feeds) {
    grouped.set(feed.adapterKey, [...(grouped.get(feed.adapterKey) ?? []), feed]);
  }

  return Array.from(grouped.entries());
}

function feedToSellerSeed(feed: SourceFeed): SellerSeed {
  const seed: SellerSeed = {
    ...(feed.seller ?? { name: feed.name.replace(/ on CarGurus$/, ''), type: 'dealer' }),
    inventoryUrl: feed.inventoryUrl
  };
  const websiteUrl = feed.seller?.websiteUrl ?? feed.websiteUrl;

  if (websiteUrl) {
    seed.websiteUrl = websiteUrl;
  }

  return seed;
}

function rowToSourceFeed(row: SourceFeedRow): SourceFeed {
  const feed: SourceFeed = {
    id: row.id,
    name: row.name,
    adapterKey: row.adapter_key,
    access: row.access,
    status: row.status,
    inventoryUrl: row.inventory_url,
    collectionPriority: row.collection_priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  if (row.seller_id) {
    feed.sellerId = row.seller_id;
  }

  if (row.seller_name && row.seller_type) {
    feed.seller = {
      name: row.seller_name,
      type: row.seller_type,
      ...(row.seller_website_url ? { websiteUrl: row.seller_website_url } : {}),
      ...(row.seller_latitude !== null && row.seller_longitude !== null
        ? {
            location: {
              latitude: row.seller_latitude,
              longitude: row.seller_longitude,
              ...(row.seller_location_label ? { label: row.seller_location_label } : {})
            }
          }
        : {})
    };
  }

  if (row.website_url) {
    feed.websiteUrl = row.website_url;
  }

  if (row.last_collected_at) {
    feed.lastCollectedAt = row.last_collected_at;
  }

  if (row.last_status) {
    feed.lastStatus = row.last_status;
  }

  if (row.last_error) {
    feed.lastError = row.last_error;
  }

  if (row.notes) {
    feed.notes = row.notes;
  }

  return feed;
}

function fallbackDealerCarSearchFeeds(now: string): SourceFeed[] {
  return cypressDealerCarSearchSeeds.map((seed, index) => {
    const feed: SourceFeed = {
      id: `fallback-dealer-car-search-${index + 1}`,
      name: seed.name,
      adapterKey: 'dealer-car-search',
      access: 'structured-web',
      status: 'active',
      inventoryUrl: seed.inventoryUrl ?? '',
      collectionPriority: index + 1,
      notes: 'Fallback feed used before source_feeds migration/seed is applied.',
      createdAt: now,
      updatedAt: now
    };

    if (seed.websiteUrl) {
      feed.websiteUrl = seed.websiteUrl;
    }

    return feed;
  });
}
