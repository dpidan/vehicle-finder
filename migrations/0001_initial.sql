PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT NOT NULL,
  locale TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE saved_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  config_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX saved_searches_user_enabled_idx ON saved_searches(user_id, enabled);

CREATE TABLE vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT,
  year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX vehicles_vin_unique_idx ON vehicles(vin) WHERE vin IS NOT NULL;
CREATE INDEX vehicles_make_model_year_idx ON vehicles(make, model, year);

CREATE TABLE sellers (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('dealer', 'private')),
  name TEXT NOT NULL,
  phone TEXT,
  website_url TEXT,
  latitude REAL,
  longitude REAL,
  location_label TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE listings (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL,
  source_name TEXT NOT NULL,
  source_access TEXT NOT NULL CHECK (
    source_access IN ('official-api', 'structured-web', 'notification-import', 'browser-assisted', 'manual-import')
  ),
  source_listing_id TEXT,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'sold', 'removed', 'unknown')),
  price_amount INTEGER,
  price_currency TEXT,
  mileage INTEGER,
  title_status TEXT CHECK (
    title_status IN ('clean', 'salvage', 'rebuilt', 'flood', 'lemon-buyback', 'odometer-discrepancy', 'unknown')
  ),
  latitude REAL,
  longitude REAL,
  location_label TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX listings_vehicle_idx ON listings(vehicle_id);
CREATE INDEX listings_seller_idx ON listings(seller_id);
CREATE INDEX listings_source_listing_idx ON listings(source_name, source_listing_id);
CREATE INDEX listings_status_last_seen_idx ON listings(status, last_seen_at);

CREATE TABLE listing_snapshots (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  captured_at TEXT NOT NULL,
  price_amount INTEGER,
  price_currency TEXT,
  mileage INTEGER,
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'sold', 'removed', 'unknown')),
  raw_title TEXT,
  raw_description TEXT
);

CREATE INDEX listing_snapshots_listing_captured_idx ON listing_snapshots(listing_id, captured_at);

CREATE TABLE evidence_records (
  id TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_access TEXT NOT NULL CHECK (
    source_access IN ('official-api', 'structured-web', 'notification-import', 'browser-assisted', 'manual-import')
  ),
  url TEXT,
  label TEXT,
  captured_at TEXT NOT NULL,
  confidence REAL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE TABLE search_evaluations (
  id TEXT PRIMARY KEY,
  saved_search_id TEXT NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  score_version TEXT NOT NULL,
  vehicle_score REAL NOT NULL CHECK (vehicle_score >= 0 AND vehicle_score <= 100),
  deal_score REAL NOT NULL CHECK (deal_score >= 0 AND deal_score <= 100),
  factors_json TEXT NOT NULL,
  flags_json TEXT NOT NULL,
  evaluated_at TEXT NOT NULL
);

CREATE INDEX search_evaluations_saved_deal_idx ON search_evaluations(saved_search_id, deal_score);
CREATE INDEX search_evaluations_saved_vehicle_idx ON search_evaluations(saved_search_id, vehicle_score);
CREATE INDEX search_evaluations_listing_idx ON search_evaluations(listing_id);

CREATE TABLE listing_dispositions (
  id TEXT PRIMARY KEY,
  saved_search_id TEXT NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  state TEXT NOT NULL CHECK (
    state IN ('new', 'interested', 'favorite', 'contacted', 'inspection', 'rejected', 'sold')
  ),
  rejection_reason TEXT,
  next_action_json TEXT,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX listing_dispositions_saved_listing_unique_idx ON listing_dispositions(saved_search_id, listing_id);
CREATE INDEX listing_dispositions_saved_state_idx ON listing_dispositions(saved_search_id, state);

CREATE TABLE attribute_definitions (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('vehicle', 'listing', 'seller', 'evaluation')),
  value_type TEXT NOT NULL CHECK (value_type IN ('string', 'number', 'boolean', 'date', 'json')),
  version INTEGER NOT NULL CHECK (version > 0)
);

CREATE UNIQUE INDEX attribute_definitions_key_owner_unique_idx ON attribute_definitions(key, owner_type);

CREATE TABLE attribute_values (
  id TEXT PRIMARY KEY,
  definition_id TEXT NOT NULL REFERENCES attribute_definitions(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('vehicle', 'listing', 'seller', 'evaluation')),
  owner_id TEXT NOT NULL,
  value_json TEXT NOT NULL,
  evidence_ids_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX attribute_values_owner_idx ON attribute_values(owner_type, owner_id);
CREATE INDEX attribute_values_definition_idx ON attribute_values(definition_id);

CREATE TABLE model_year_risks (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('preferred', 'good', 'neutral', 'caution', 'avoid-unless-remediated')),
  trim_json TEXT,
  engine_json TEXT,
  transmission_json TEXT,
  issue TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('engine', 'transmission', 'electrical', 'body', 'maintenance', 'safety')),
  severity INTEGER NOT NULL CHECK (severity >= 0 AND severity <= 10),
  inspect_for_json TEXT NOT NULL,
  remediation_json TEXT,
  evidence_ids_json TEXT NOT NULL,
  CHECK (year_start <= year_end)
);

CREATE INDEX model_year_risks_make_model_year_idx ON model_year_risks(make, model, year_start, year_end);
