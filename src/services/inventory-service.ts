import type { ListingCandidate } from '../domain/entities.js';

export interface ImportInventoryResult {
  candidateCount: number;
  insertedListings: number;
  updatedListings: number;
  snapshotCount: number;
}

interface IdRow {
  id: string;
}

export async function importListingCandidates(
  db: D1Database,
  candidates: ListingCandidate[]
): Promise<ImportInventoryResult> {
  const result: ImportInventoryResult = {
    candidateCount: candidates.length,
    insertedListings: 0,
    updatedListings: 0,
    snapshotCount: 0
  };

  for (const candidate of candidates) {
    const vehicleId = await upsertVehicle(db, candidate);
    const sellerId = candidate.seller ? await upsertSeller(db, candidate) : undefined;
    const listing = await findListing(db, candidate);
    const listingId = listing?.id ?? crypto.randomUUID();

    if (listing) {
      await updateListing(db, listingId, vehicleId, sellerId, candidate);
      result.updatedListings += 1;
    } else {
      await insertListing(db, listingId, vehicleId, sellerId, candidate);
      result.insertedListings += 1;
    }

    await insertSnapshot(db, listingId, candidate);
    result.snapshotCount += 1;
  }

  return result;
}

async function upsertVehicle(db: D1Database, candidate: ListingCandidate): Promise<string> {
  const vin = candidate.vehicle.vin?.toUpperCase();
  const existing = vin ? await db.prepare(`SELECT id FROM vehicles WHERE vin = ?`).bind(vin).first<IdRow>() : null;

  if (existing) {
    await db
      .prepare(
        `UPDATE vehicles
         SET year = COALESCE(?, year), make = COALESCE(?, make), model = COALESCE(?, model), trim = COALESCE(?, trim),
             updated_at = ?
         WHERE id = ?`
      )
      .bind(
        candidate.vehicle.year ?? null,
        candidate.vehicle.make ?? null,
        candidate.vehicle.model ?? null,
        candidate.vehicle.trim ?? null,
        candidate.capturedAt,
        existing.id
      )
      .run();
    return existing.id;
  }

  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO vehicles
       (id, vin, year, make, model, trim, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      vin ?? null,
      candidate.vehicle.year ?? null,
      candidate.vehicle.make ?? null,
      candidate.vehicle.model ?? null,
      candidate.vehicle.trim ?? null,
      candidate.capturedAt,
      candidate.capturedAt
    )
    .run();

  return id;
}

async function upsertSeller(db: D1Database, candidate: ListingCandidate): Promise<string> {
  const seller = candidate.seller;

  if (!seller) {
    throw new Error('Cannot upsert missing seller.');
  }

  const existing = await db.prepare(`SELECT id FROM sellers WHERE name = ? AND type = ? LIMIT 1`).bind(seller.name, seller.type).first<IdRow>();

  if (existing) {
    await db
      .prepare(
        `UPDATE sellers
         SET phone = COALESCE(?, phone), website_url = COALESCE(?, website_url),
             latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
             location_label = COALESCE(?, location_label), updated_at = ?
         WHERE id = ?`
      )
      .bind(
        seller.phone ?? null,
        seller.websiteUrl ?? null,
        seller.location?.latitude ?? null,
        seller.location?.longitude ?? null,
        seller.location?.label ?? null,
        candidate.capturedAt,
        existing.id
      )
      .run();
    return existing.id;
  }

  const id = crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO sellers
       (id, type, name, phone, website_url, latitude, longitude, location_label, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      seller.type,
      seller.name,
      seller.phone ?? null,
      seller.websiteUrl ?? null,
      seller.location?.latitude ?? null,
      seller.location?.longitude ?? null,
      seller.location?.label ?? null,
      candidate.capturedAt,
      candidate.capturedAt
    )
    .run();

  return id;
}

async function findListing(db: D1Database, candidate: ListingCandidate): Promise<IdRow | null> {
  if (candidate.sourceListingId) {
    return db
      .prepare(`SELECT id FROM listings WHERE source_name = ? AND source_listing_id = ? LIMIT 1`)
      .bind(candidate.source.name, candidate.sourceListingId)
      .first<IdRow>();
  }

  return db.prepare(`SELECT id FROM listings WHERE source_name = ? AND url = ? LIMIT 1`).bind(candidate.source.name, candidate.url).first<IdRow>();
}

async function insertListing(
  db: D1Database,
  id: string,
  vehicleId: string,
  sellerId: string | undefined,
  candidate: ListingCandidate
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO listings
       (id, vehicle_id, seller_id, source_name, source_access, source_listing_id, url, title, status,
        price_amount, price_currency, mileage, title_status, latitude, longitude, location_label,
        first_seen_at, last_seen_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(...listingValues(id, vehicleId, sellerId, candidate, candidate.capturedAt))
    .run();
}

async function updateListing(
  db: D1Database,
  id: string,
  vehicleId: string,
  sellerId: string | undefined,
  candidate: ListingCandidate
): Promise<void> {
  await db
    .prepare(
      `UPDATE listings
       SET vehicle_id = ?, seller_id = ?, url = ?, title = ?, status = ?, price_amount = ?, price_currency = ?,
           mileage = ?, title_status = ?, latitude = ?, longitude = ?, location_label = ?, last_seen_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(
      vehicleId,
      sellerId ?? null,
      candidate.url,
      candidate.title,
      candidate.status ?? 'active',
      candidate.price?.amount ?? null,
      candidate.price?.currency ?? null,
      candidate.mileage ?? null,
      candidate.titleStatus ?? null,
      candidate.location?.latitude ?? null,
      candidate.location?.longitude ?? null,
      candidate.location?.label ?? null,
      candidate.capturedAt,
      candidate.capturedAt,
      id
    )
    .run();
}

function listingValues(
  id: string,
  vehicleId: string,
  sellerId: string | undefined,
  candidate: ListingCandidate,
  createdAt: string
): unknown[] {
  return [
    id,
    vehicleId,
    sellerId ?? null,
    candidate.source.name,
    candidate.source.access,
    candidate.sourceListingId ?? null,
    candidate.url,
    candidate.title,
    candidate.status ?? 'active',
    candidate.price?.amount ?? null,
    candidate.price?.currency ?? null,
    candidate.mileage ?? null,
    candidate.titleStatus ?? null,
    candidate.location?.latitude ?? null,
    candidate.location?.longitude ?? null,
    candidate.location?.label ?? null,
    candidate.capturedAt,
    candidate.capturedAt,
    createdAt,
    candidate.capturedAt
  ];
}

async function insertSnapshot(db: D1Database, listingId: string, candidate: ListingCandidate): Promise<void> {
  await db
    .prepare(
      `INSERT INTO listing_snapshots
       (id, listing_id, captured_at, price_amount, price_currency, mileage, status, raw_title, raw_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      listingId,
      candidate.capturedAt,
      candidate.price?.amount ?? null,
      candidate.price?.currency ?? null,
      candidate.mileage ?? null,
      candidate.status ?? 'active',
      candidate.title,
      candidate.rawDescription ?? null
    )
    .run();
}
