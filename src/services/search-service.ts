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
  photo_urls_json: string | null;
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
  disposition_id: string | null;
  disposition_saved_search_id: string | null;
  disposition_listing_id: string | null;
  disposition_state: ListingDispositionState | null;
  disposition_rejection_reason: string | null;
  disposition_next_action_json: string | null;
  disposition_updated_at: string | null;
}

interface SnapshotRow {
  id: string;
  captured_at: string;
  price_amount: number | null;
  price_currency: 'USD' | null;
  mileage: number | null;
  photo_urls_json: string | null;
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
    photoUrls?: string[];
    status: ListingCandidate['status'];
    rawTitle?: string;
    rawDescription?: string;
  }>;
}

export interface RankedPersistedListing {
  listingId: string;
  rankedListing: RankedListing;
  disposition: ListingDisposition | null;
}

export interface WriteSearchEvaluationsResult {
  insertedEvaluations: number;
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

interface SearchEvaluationRow {
  id: string;
  saved_search_id: string;
  listing_id: string;
  vehicle_id: string;
  score_version: string;
  vehicle_score: number;
  deal_score: number;
  factors_json: string;
  flags_json: string;
  evaluated_at: string;
  listing_title: string;
  listing_url: string;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
}

export interface SearchEvaluationSummary {
  id: string;
  savedSearchId: string;
  listingId: string;
  vehicleId: string;
  scoreVersion: string;
  vehicleScore: number;
  dealScore: number;
  factors: RankedListing['factors'];
  flags: string[];
  evaluatedAt: string;
  listing: {
    title: string;
    url: string;
  };
  vehicle: {
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
  };
}

interface ListingChangeRow {
  listing_id: string;
  title: string;
  url: string;
  detected_at: string;
  current_price_amount: number | null;
  previous_price_amount: number | null;
  current_price_currency: 'USD' | null;
  previous_price_currency: 'USD' | null;
}

export interface ListingChangeSummary {
  listingId: string;
  title: string;
  url: string;
  detectedAt: string;
  currentPrice?: { amount: number; currency: 'USD' };
  previousPrice?: { amount: number; currency: 'USD' };
}

export interface ListingChanges {
  newListings: ListingChangeSummary[];
  priceDrops: ListingChangeSummary[];
}

interface StaleListingRow {
  listing_id: string;
  title: string;
  url: string;
  last_seen_at: string;
  price_amount: number | null;
  price_currency: 'USD' | null;
}

export interface StaleListingSummary {
  listingId: string;
  title: string;
  url: string;
  lastSeenAt: string;
  price?: { amount: number; currency: 'USD' };
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
  const candidates = await listPersistedListingCandidates(db, search.id);
  const listingIds = new WeakMap<ListingCandidate, string>();
  const dispositions = new WeakMap<ListingCandidate, ListingDisposition | null>();

  for (const candidate of candidates) {
    listingIds.set(candidate, candidate.listingId);
    dispositions.set(candidate, candidate.disposition);
  }

  return rankListingsForSearch(search.config, candidates).flatMap((rankedListing) => {
    const listingId = listingIds.get(rankedListing.listing);
    return listingId
      ? [
          {
            listingId,
            rankedListing: { ...rankedListing, listing: withoutListingId(rankedListing.listing) },
            disposition: dispositions.get(rankedListing.listing) ?? null
          }
        ]
      : [];
  });
}

export async function writeSearchEvaluations(
  db: D1Database,
  savedSearchId: string,
  rankedListings: RankedPersistedListing[],
  evaluatedAt: string
): Promise<WriteSearchEvaluationsResult> {
  let insertedEvaluations = 0;

  for (const { listingId, rankedListing } of rankedListings) {
    await db
      .prepare(
        `INSERT INTO search_evaluations
         (id, saved_search_id, listing_id, vehicle_id, score_version, vehicle_score, deal_score, factors_json, flags_json, evaluated_at)
         SELECT ?, ?, listings.id, listings.vehicle_id, ?, ?, ?, ?, ?, ?
         FROM listings
         WHERE listings.id = ?`
      )
      .bind(
        crypto.randomUUID(),
        savedSearchId,
        rankedListing.scoreVersion,
        rankedListing.vehicleScore,
        rankedListing.dealScore,
        JSON.stringify(rankedListing.factors),
        JSON.stringify(rankedListing.flags),
        evaluatedAt,
        listingId
      )
      .run();
    insertedEvaluations += 1;
  }

  return { insertedEvaluations };
}

export async function listLatestSearchEvaluations(db: D1Database, savedSearchId: string): Promise<SearchEvaluationSummary[]> {
  const { results } = await db
    .prepare(
      `SELECT
         search_evaluations.id,
         search_evaluations.saved_search_id,
         search_evaluations.listing_id,
         search_evaluations.vehicle_id,
         search_evaluations.score_version,
         search_evaluations.vehicle_score,
         search_evaluations.deal_score,
         search_evaluations.factors_json,
         search_evaluations.flags_json,
         search_evaluations.evaluated_at,
         listings.title AS listing_title,
         listings.url AS listing_url,
         vehicles.vin,
         vehicles.year,
         vehicles.make,
         vehicles.model
       FROM search_evaluations
       JOIN listings ON listings.id = search_evaluations.listing_id
       JOIN vehicles ON vehicles.id = search_evaluations.vehicle_id
       WHERE search_evaluations.saved_search_id = ?
         AND search_evaluations.evaluated_at = (
           SELECT MAX(latest.evaluated_at)
           FROM search_evaluations latest
           WHERE latest.saved_search_id = search_evaluations.saved_search_id
             AND latest.listing_id = search_evaluations.listing_id
         )
       ORDER BY search_evaluations.deal_score DESC, search_evaluations.vehicle_score DESC
       LIMIT 100`
    )
    .bind(savedSearchId)
    .all<SearchEvaluationRow>();

  return results.map(toSearchEvaluationSummary);
}

export async function listListingChanges(db: D1Database, savedSearchId: string, since: string): Promise<ListingChanges> {
  const newListings = await db
    .prepare(
      `SELECT DISTINCT
         listings.id AS listing_id,
         listings.title,
         listings.url,
         listings.first_seen_at AS detected_at,
         listings.price_amount AS current_price_amount,
         NULL AS previous_price_amount,
         listings.price_currency AS current_price_currency,
         NULL AS previous_price_currency
       FROM listings
       JOIN search_evaluations
         ON search_evaluations.listing_id = listings.id
        AND search_evaluations.saved_search_id = ?
       WHERE listings.status IN ('active', 'pending', 'unknown')
         AND listings.first_seen_at > ?
       ORDER BY detected_at DESC, title
       LIMIT 100`
    )
    .bind(savedSearchId, since)
    .all<ListingChangeRow>();

  const priceDrops = await db
    .prepare(
      `SELECT DISTINCT
         listings.id AS listing_id,
         listings.title,
         listings.url,
         latest.captured_at AS detected_at,
         latest.price_amount AS current_price_amount,
         previous.price_amount AS previous_price_amount,
         latest.price_currency AS current_price_currency,
         previous.price_currency AS previous_price_currency
       FROM listings
       JOIN search_evaluations
         ON search_evaluations.listing_id = listings.id
        AND search_evaluations.saved_search_id = ?
       JOIN listing_snapshots latest ON latest.listing_id = listings.id
       JOIN listing_snapshots previous
         ON previous.listing_id = listings.id
        AND previous.captured_at = (
          SELECT MAX(candidate.captured_at)
          FROM listing_snapshots candidate
          WHERE candidate.listing_id = listings.id
            AND candidate.captured_at < latest.captured_at
        )
       WHERE listings.status IN ('active', 'pending', 'unknown')
         AND latest.captured_at > ?
         AND latest.price_amount IS NOT NULL
         AND previous.price_amount IS NOT NULL
         AND latest.price_amount < previous.price_amount
         AND latest.captured_at = (
           SELECT MAX(current.captured_at)
           FROM listing_snapshots current
           WHERE current.listing_id = listings.id
         )
       ORDER BY detected_at DESC, title
       LIMIT 100`
    )
    .bind(savedSearchId, since)
    .all<ListingChangeRow>();

  return {
    newListings: newListings.results.map(toListingChangeSummary),
    priceDrops: priceDrops.results.map(toListingChangeSummary)
  };
}

function toListingChangeSummary(row: ListingChangeRow): ListingChangeSummary {
  return {
    listingId: row.listing_id,
    title: row.title,
    url: row.url,
    detectedAt: row.detected_at,
    ...(row.current_price_amount !== null && row.current_price_currency
      ? { currentPrice: { amount: row.current_price_amount, currency: row.current_price_currency } }
      : {}),
    ...(row.previous_price_amount !== null && row.previous_price_currency
      ? { previousPrice: { amount: row.previous_price_amount, currency: row.previous_price_currency } }
      : {})
  };
}

export async function listStaleListings(db: D1Database, savedSearchId: string, before: string): Promise<StaleListingSummary[]> {
  const { results } = await db
    .prepare(
      `SELECT DISTINCT
         listings.id AS listing_id,
         listings.title,
         listings.url,
         listings.last_seen_at,
         listings.price_amount,
         listings.price_currency
       FROM listings
       JOIN search_evaluations
         ON search_evaluations.listing_id = listings.id
        AND search_evaluations.saved_search_id = ?
       WHERE listings.status IN ('active', 'pending', 'unknown')
         AND listings.last_seen_at < ?
       ORDER BY listings.last_seen_at, listings.title
       LIMIT 100`
    )
    .bind(savedSearchId, before)
    .all<StaleListingRow>();

  return results.map((row) => ({
    listingId: row.listing_id,
    title: row.title,
    url: row.url,
    lastSeenAt: row.last_seen_at,
    ...(row.price_amount !== null && row.price_currency ? { price: { amount: row.price_amount, currency: row.price_currency } } : {})
  }));
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
         listings.photo_urls_json,
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
      `SELECT id, captured_at, price_amount, price_currency, mileage, photo_urls_json, status, raw_title, raw_description
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

async function listPersistedListingCandidates(db: D1Database, savedSearchId: string): Promise<Array<ListingCandidate & { listingId: string; disposition: ListingDisposition | null }>> {
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
         listings.photo_urls_json,
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
         sellers.location_label AS seller_location_label,
         listing_dispositions.id AS disposition_id,
         listing_dispositions.saved_search_id AS disposition_saved_search_id,
         listing_dispositions.listing_id AS disposition_listing_id,
         listing_dispositions.state AS disposition_state,
         listing_dispositions.rejection_reason AS disposition_rejection_reason,
         listing_dispositions.next_action_json AS disposition_next_action_json,
         listing_dispositions.updated_at AS disposition_updated_at
       FROM listings
       JOIN vehicles ON vehicles.id = listings.vehicle_id
       LEFT JOIN sellers ON sellers.id = listings.seller_id
       LEFT JOIN listing_dispositions
         ON listing_dispositions.listing_id = listings.id
        AND listing_dispositions.saved_search_id = ?
       WHERE listings.status IN ('active', 'pending', 'unknown')
       ORDER BY listings.last_seen_at DESC
       LIMIT 100`
    )
    .bind(savedSearchId)
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

function toListingCandidate(row: PersistedListingRow): ListingCandidate & { listingId: string; disposition: ListingDisposition | null } {
  return {
    listingId: row.id,
    disposition: toNullableListingDisposition(row),
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
    ...(row.photo_urls_json ? { photoUrls: JSON.parse(row.photo_urls_json) as string[] } : {}),
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
    ...(row.photo_urls_json ? { photoUrls: JSON.parse(row.photo_urls_json) as string[] } : {}),
    status: row.status,
    ...(row.raw_title ? { rawTitle: row.raw_title } : {}),
    ...(row.raw_description ? { rawDescription: row.raw_description } : {})
  };
}

function withoutListingId(candidate: ListingCandidate & { listingId?: string }): ListingCandidate {
  const { listingId: _listingId, disposition: _disposition, ...listing } = candidate as ListingCandidate & {
    listingId?: string;
    disposition?: ListingDisposition | null;
  };
  return listing;
}

function toNullableListingDisposition(row: PersistedListingRow): ListingDisposition | null {
  if (!row.disposition_id || !row.disposition_saved_search_id || !row.disposition_listing_id || !row.disposition_state || !row.disposition_updated_at) {
    return null;
  }

  return toListingDisposition({
    id: row.disposition_id,
    saved_search_id: row.disposition_saved_search_id,
    listing_id: row.disposition_listing_id,
    state: row.disposition_state,
    rejection_reason: row.disposition_rejection_reason,
    next_action_json: row.disposition_next_action_json,
    updated_at: row.disposition_updated_at
  });
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

function toSearchEvaluationSummary(row: SearchEvaluationRow): SearchEvaluationSummary {
  return {
    id: row.id,
    savedSearchId: row.saved_search_id,
    listingId: row.listing_id,
    vehicleId: row.vehicle_id,
    scoreVersion: row.score_version,
    vehicleScore: row.vehicle_score,
    dealScore: row.deal_score,
    factors: JSON.parse(row.factors_json) as RankedListing['factors'],
    flags: JSON.parse(row.flags_json) as string[],
    evaluatedAt: row.evaluated_at,
    listing: {
      title: row.listing_title,
      url: row.listing_url
    },
    vehicle: {
      ...(row.vin ? { vin: row.vin } : {}),
      ...(row.year ? { year: row.year } : {}),
      ...(row.make ? { make: row.make } : {}),
      ...(row.model ? { model: row.model } : {})
    }
  };
}
