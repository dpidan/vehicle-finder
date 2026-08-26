import type { ListingCandidate, SavedSearch } from '../domain/entities.js';
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

export async function rankPersistedListingsForSavedSearch(db: D1Database, search: SavedSearch): Promise<RankedListing[]> {
  return rankListingsForSearch(search.config, await listPersistedListingCandidates(db));
}

async function listPersistedListingCandidates(db: D1Database): Promise<ListingCandidate[]> {
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

function toListingCandidate(row: PersistedListingRow): ListingCandidate {
  return {
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
