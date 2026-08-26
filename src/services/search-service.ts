import type { SavedSearch } from '../domain/entities.js';
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
