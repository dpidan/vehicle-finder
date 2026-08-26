import type { ListingCandidate, ListingDisposition, ListingDispositionState, NextAction, SavedSearch } from '../domain/entities.js';
import type { SavedSearchConfig } from '../domain/search-config.js';
import { rankListingsForSearch, type RankedListing } from '../scoring/rank-listings.js';
import { collectSampleListings } from '../sources/sample-source.js';

export interface SavedSearchRow {
  id: string;
  user_id: string;
  name: string;
  enabled: number;
  config_json: string;
  created_at: string;
  updated_at: string;
}

interface PersistedListingRow {
  id: string;
  source_name: string;
  source_access: ListingCandidate['source']['access'];
  source_listing_id: string | null;
  url: string;
  title: string;
  status: ListingCandidate['status'];
  price_amount: number | null;
  price_currency: 'USD' | null;
  mileage: number | null;
  title_status: ListingCandidate['titleStatus'] | null;
  listing_latitude: number | null;
  listing_longitude: number | null;
  listing_location_label: string | null;
  last_seen_at: string;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  seller_name: string | null;
  seller_type: 'dealer' | 'private' | null;
  seller_phone: string | null;
  seller_website_url: string | null;
  seller_latitude: number | null;
  seller_longitude: number | null;
  seller_location_label: string | null;
}

interface SnapshotRow {
  id: string;
  captured_at: string;
  price_amount: number | null;
  price_currency: 'USD' | null;
  mileage: number | null;
  status: ListingCandidate['status'];
  raw_title: string | null;
  raw_description: string | null;
}

export interface ListingDetail {
  listing: ListingCandidate;
  snapshots: Array<{
    id: string;
    capturedAt: string;
    price?: { amount: number; currency: 'USD' };
    mileage?: number;
    status: ListingCandidate['status'];
    rawTitle?: string;
    rawDescription?: string;
  }>;
}

export interface RankedPersistedListing {
  listingId: string;
  rankedListing: RankedListing;
}

export interface ListingDispositionInput {
  state: ListingDispositionState;
  rejectionReason?: string;
  nextAction?: NextAction;
}

interface ListingDispositionRow {
  id: string;
  saved_search_id: string;
  listing_id: string;
  state: ListingDispositionState;
  rejection_reason: string | null;
  next_action_json: string | null;
  updated_at: string;
}

export async function listSavedSearches(db: D1Database): Promise<SavedSearch[]> {
  const { results } = await db
    .prepare(
      `SELECT id, user_id, name, enabled, config_json, created_at, updated_at
       FROM saved_searches
       ORDER BY name`
    )
    .all<SavedSearchRow>();

  return results.map(toSavedSearch);
}

export async function getSavedSearch(db: D1Database, id: string): Promise<SavedSearch | null> {
  const row = await db
    .prepare(
      `SELECT id, user_id, name, enabled, config_json, created_at, updated_at
       FROM saved_searches
       WHERE id = ?`
    )
    .bind(id)
    .first<SavedSearchRow>();

  return row ? toSavedSearch(row) : null;
}

export async function rankSampleListingsForSavedSearch(
  search: SavedSearch,
  collectedAt: string
): Promise<RankedListing[]> {
  return rankListingsForSearch(search.config, await collectSampleListings(collectedAt));
}

export async function rankPersistedListingsForSavedSearch(db: D1Database, search: SavedSearch): Promise<RankedPersistedListing[]> {
  const candidates = await listPersistedListingCandidates(db);
  const listingIds = new WeakMap<ListingCandidate, string>();

  for (const candidate of candidates) {
    listingIds.set(candidate, candidate.listingId);
  }

  return rankListingsForSearch(search.config, candidates).flatMap((rankedListing) => {
    const listingId = listingIds.get(rankedListing.listing);
    return listingId ? [{ listingId, rankedListing: { ...rankedListing, listing: withoutListingId(rankedListing.listing) } }] : [];
  });
}

export async function getListingDetail(db: D1Database, id: string): Promise<ListingDetail | null> {
  const row = await db
    .prepare(
      `SELECT
         listings.id,
         listings.source_name,
         listings.source_access,
         listings.source_listing_id,
         listings.url,
         listings.title,
         listings.status,
         listings.price_amount,
         listings.price_currency,
         listings.mileage,
         listings.title_status,
         listings.latitude AS listing_latitude,
         listings.longitude AS listing_longitude,
         listings.location_label AS listing_location_label,
         listings.last_seen_at,
         vehicles.vin,
         vehicles.year,
         vehicles.make,
         vehicles.model,
         vehicles.trim,
         sellers.type AS seller_type,
         sellers.name AS seller_name,
         sellers.phone AS seller_phone,
         sellers.website_url AS seller_website_url,
         sellers.latitude AS seller_latitude,
         sellers.longitude AS seller_longitude,
         sellers.location_label AS seller_location_label
       FROM listings
       JOIN vehicles ON vehicles.id = listings.vehicle_id
       LEFT JOIN sellers ON sellers.id = listings.seller_id
       WHERE listings.id = ?`
    )
    .bind(id)
    .first<PersistedListingRow>();

  if (!row) {
    return null;
  }

  const { results } = await db
    .prepare(
      `SELECT id, captured_at, price_amount, price_currency, mileage, status, raw_title, raw_description
       FROM listing_snapshots
       WHERE listing_id = ?
       ORDER BY captured_at DESC
       LIMIT 25`
    )
    .bind(id)
    .all<SnapshotRow>();

  return {
    listing: withoutListingId(toListingCandidate(row)),
    snapshots: results.map(toSnapshot)
  };
}

export async function listingExists(db: D1Database, id: string): Promise<boolean> {
  const row = await db.prepare(`SELECT id FROM listings WHERE id = ?`).bind(id).first<{ id: string }>();
  return Boolean(row);
}

export async function getListingDisposition(
  db: D1Database,
  savedSearchId: string,
  listingId: string
): Promise<ListingDisposition | null> {
  const row = await db
    .prepare(
      `SELECT id, saved_search_id, listing_id, state, rejection_reason, next_action_json, updated_at
       FROM listing_dispositions
       WHERE saved_search_id = ? AND listing_id = ?`
    )
    .bind(savedSearchId, listingId)
    .first<ListingDispositionRow>();

  return row ? toListingDisposition(row) : null;
}

export async function setListingDisposition(
  db: D1Database,
  savedSearchId: string,
  listingId: string,
  input: ListingDispositionInput,
  updatedAt: string
): Promise<ListingDisposition> {
  const existing = await getListingDisposition(db, savedSearchId, listingId);
  const id = existing?.id ?? crypto.randomUUID();
  const nextActionJson = input.nextAction && input.nextAction.type !== 'none' ? JSON.stringify(input.nextAction) : null;

  if (existing) {
    await db
      .prepare(
        `UPDATE listing_dispositions
         SET state = ?, rejection_reason = ?, next_action_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(input.state, input.rejectionReason ?? null, nextActionJson, updatedAt, id)
      .run();
  } else {
    await db
      .prepare(
        `INSERT INTO listing_dispositions
         (id, saved_search_id, listing_id, state, rejection_reason, next_action_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, savedSearchId, listingId, input.state, input.rejectionReason ?? null, nextActionJson, updatedAt)
      .run();
  }

  return {
    id,
    savedSearchId,
    listingId,
    state: input.state,
    ...(input.rejectionReason ? { rejectionReason: input.rejectionReason } : {}),
    ...(input.nextAction && input.nextAction.type !== 'none' ? { nextAction: input.nextAction } : {}),
    updatedAt
  };
}

async function listPersistedListingCandidates(db: D1Database): Promise<Array<ListingCandidate & { listingId: string }>> {
  const { results } = await db
    .prepare(
      `SELECT
         listings.id,
         listings.source_name,
         listings.source_access,
         listings.source_listing_id,
         listings.url,
         listings.title,
         listings.status,
         listings.price_amount,
         listings.price_currency,
         listings.mileage,
         listings.title_status,
         listings.latitude AS listing_latitude,
         listings.longitude AS listing_longitude,
         listings.location_label AS listing_location_label,
         listings.last_seen_at,
         vehicles.vin,
         vehicles.year,
         vehicles.make,
         vehicles.model,
         vehicles.trim,
         sellers.type AS seller_type,
         sellers.name AS seller_name,
         sellers.phone AS seller_phone,
         sellers.website_url AS seller_website_url,
         sellers.latitude AS seller_latitude,
         sellers.longitude AS seller_longitude,
         sellers.location_label AS seller_location_label
       FROM listings
       JOIN vehicles ON vehicles.id = listings.vehicle_id
       LEFT JOIN sellers ON sellers.id = listings.seller_id
       WHERE listings.status IN ('active', 'pending', 'unknown')
       ORDER BY listings.last_seen_at DESC
       LIMIT 100`
    )
    .all<PersistedListingRow>();

  return results.map(toListingCandidate);
}

function toSavedSearch(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    enabled: row.enabled === 1,
    config: JSON.parse(row.config_json) as SavedSearchConfig,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toListingCandidate(row: PersistedListingRow): ListingCandidate & { listingId: string } {
  return {
    listingId: row.id,
    source: { name: row.source_name, access: row.source_access },
    ...(row.source_listing_id ? { sourceListingId: row.source_listing_id } : {}),
    url: row.url,
    title: row.title,
    status: row.status ?? 'unknown',
    vehicle: {
      ...(row.vin ? { vin: row.vin } : {}),
      ...(row.year ? { year: row.year } : {}),
      ...(row.make ? { make: row.make } : {}),
      ...(row.model ? { model: row.model } : {}),
      ...(row.trim ? { trim: row.trim } : {})
    },
    ...(row.seller_name && row.seller_type
      ? {
          seller: {
            name: row.seller_name,
            type: row.seller_type,
            ...(row.seller_phone ? { phone: row.seller_phone } : {}),
            ...(row.seller_website_url ? { websiteUrl: row.seller_website_url } : {}),
            ...(row.seller_latitude && row.seller_longitude
              ? { location: location(row.seller_latitude, row.seller_longitude, row.seller_location_label) }
              : {})
          }
        }
      : {}),
    ...(row.price_amount && row.price_currency ? { price: { amount: row.price_amount, currency: row.price_currency } } : {}),
    ...(row.mileage ? { mileage: row.mileage } : {}),
    ...(row.title_status ? { titleStatus: row.title_status } : {}),
    ...(row.listing_latitude && row.listing_longitude
      ? { location: location(row.listing_latitude, row.listing_longitude, row.listing_location_label) }
      : {}),
    capturedAt: row.last_seen_at
  };
}

function location(latitude: number, longitude: number, label: string | null): { latitude: number; longitude: number; label?: string } {
  return {
    latitude,
    longitude,
    ...(label ? { label } : {})
  };
}

function toSnapshot(row: SnapshotRow): ListingDetail['snapshots'][number] {
  return {
    id: row.id,
    capturedAt: row.captured_at,
    ...(row.price_amount && row.price_currency ? { price: { amount: row.price_amount, currency: row.price_currency } } : {}),
    ...(row.mileage ? { mileage: row.mileage } : {}),
    status: row.status,
    ...(row.raw_title ? { rawTitle: row.raw_title } : {}),
    ...(row.raw_description ? { rawDescription: row.raw_description } : {})
  };
}

function withoutListingId(candidate: ListingCandidate & { listingId?: string }): ListingCandidate {
  const { listingId: _listingId, ...listing } = candidate;
  return listing;
}

function toListingDisposition(row: ListingDispositionRow): ListingDisposition {
  return {
    id: row.id,
    savedSearchId: row.saved_search_id,
    listingId: row.listing_id,
    state: row.state,
    ...(row.rejection_reason ? { rejectionReason: row.rejection_reason } : {}),
    ...(row.next_action_json ? { nextAction: JSON.parse(row.next_action_json) as NextAction } : {}),
    updatedAt: row.updated_at
  };
}
