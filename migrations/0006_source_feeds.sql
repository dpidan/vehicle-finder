CREATE TABLE source_feeds (
  id TEXT PRIMARY KEY,
  seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  adapter_key TEXT NOT NULL CHECK (adapter_key IN ('dealer-car-search', 'carsforsale', 'cargurus', 'manual-import')),
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
  updated_at TEXT NOT NULL
);

CREATE INDEX source_feeds_adapter_status_idx ON source_feeds(adapter_key, status, collection_priority);
CREATE INDEX source_feeds_seller_idx ON source_feeds(seller_id);
CREATE UNIQUE INDEX source_feeds_adapter_inventory_unique_idx ON source_feeds(adapter_key, inventory_url);
