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
  'seller-crown-auto',
  'dealer',
  'CROWN AUTO',
  '832-422-2600',
  'https://www.mycrownauto.com',
  30.0551,
  -95.5053,
  '5514 Louetta Rd, Spring, TX 77379',
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
  'feed-gotgoodcars-crown-auto',
  'seller-crown-auto',
  'CROWN AUTO GotGoodCars',
  'gotgoodcars',
  'structured-web',
  'paused',
  'https://crownautoinc.gotgoodcars.com/all-inventory/?price%5B%5D=0&price%5B%5D=20000',
  'https://www.mycrownauto.com',
  170,
  'GotGoodCars under-$20k feed for a Spring dealer; standalone validation returned 29 candidates with price, mileage, color, and detail URLs.',
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
