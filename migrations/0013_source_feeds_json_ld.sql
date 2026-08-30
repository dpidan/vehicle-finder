CREATE TABLE source_feeds_next (
  id TEXT PRIMARY KEY,
  seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  adapter_key TEXT NOT NULL CHECK (
    adapter_key IN ('dealer-car-search', 'dealer-com', 'dealer-sitemap', 'carsforsale', 'cargurus', 'iseecars', 'json-ld', 'mynextride', 'manual-import')
  ),
  access TEXT NOT NULL CHECK (
    access IN ('official-api', 'structured-web', 'notification-import', 'browser-assisted', 'manual-import')
  ),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'blocked', 'retired')),
  inventory_url TEXT NOT NULL,
  website_url TEXT,
  collection_priority INTEGER NOT NULL DEFAULT 100,
  last_collected_at TEXT,
  last_status TEXT,
  last_error TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_candidate_count INTEGER
);

INSERT INTO source_feeds_next (
  id,
  seller_id,
  name,
  adapter_key,
  access,
  status,
  inventory_url,
  website_url,
  collection_priority,
  last_collected_at,
  last_status,
  last_error,
  notes,
  created_at,
  updated_at,
  last_candidate_count
)
SELECT
  id,
  seller_id,
  name,
  adapter_key,
  access,
  status,
  inventory_url,
  website_url,
  collection_priority,
  last_collected_at,
  last_status,
  last_error,
  notes,
  created_at,
  updated_at,
  last_candidate_count
FROM source_feeds;

DROP TABLE source_feeds;
ALTER TABLE source_feeds_next RENAME TO source_feeds;

CREATE INDEX source_feeds_adapter_status_idx ON source_feeds(adapter_key, status, collection_priority);
CREATE INDEX source_feeds_seller_idx ON source_feeds(seller_id);
CREATE UNIQUE INDEX source_feeds_adapter_inventory_unique_idx ON source_feeds(adapter_key, inventory_url);

INSERT INTO sellers (
  id,
  type,
  name,
  phone,
  website_url,
  latitude,
  longitude,
  location_label,
  created_at,
  updated_at
)
VALUES (
  'seller-ride-motors',
  'dealer',
  'Ride Motors LLC',
  '832-653-2843',
  'https://www.ridemotorsllc.com',
  29.9754,
  -95.6785,
  '12710 Telge Rd, Cypress, TX 77429',
  '2026-08-29T00:00:00.000Z',
  '2026-08-29T00:00:00.000Z'
)
ON CONFLICT(id) DO UPDATE SET
  type = excluded.type,
  name = excluded.name,
  phone = excluded.phone,
  website_url = excluded.website_url,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  location_label = excluded.location_label,
  updated_at = excluded.updated_at;

INSERT INTO source_feeds (
  id,
  seller_id,
  name,
  adapter_key,
  access,
  status,
  inventory_url,
  website_url,
  collection_priority,
  notes,
  created_at,
  updated_at
)
VALUES (
  'feed-json-ld-ride-motors',
  'seller-ride-motors',
  'Ride Motors LLC generic JSON-LD',
  'json-ld',
  'structured-web',
  'paused',
  'https://www.iseecars.com/dealer-3450550-ride-motors-llc-in-cypress-tx',
  'https://www.ridemotorsllc.com',
  160,
  'Generic JSON-LD adapter-development feed; overlaps iSeeCars-specific feed and should stay paused unless used for parser comparison.',
  '2026-08-29T00:00:00.000Z',
  '2026-08-29T00:00:00.000Z'
)
ON CONFLICT(id) DO UPDATE SET
  seller_id = excluded.seller_id,
  name = excluded.name,
  adapter_key = excluded.adapter_key,
  access = excluded.access,
  status = excluded.status,
  inventory_url = excluded.inventory_url,
  website_url = excluded.website_url,
  collection_priority = excluded.collection_priority,
  notes = excluded.notes,
  updated_at = excluded.updated_at;
