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
VALUES
  (
    'seller-texans-auto-group',
    'dealer',
    'Texans Auto Group',
    '281-288-3388',
    'https://texansautogroup.com',
    30.0703,
    -95.4935,
    '4919 Farm to Market 2920, Spring, TX 77388',
    '2026-08-29T00:00:00.000Z',
    '2026-08-29T00:00:00.000Z'
  ),
  (
    'seller-lone-star-auto-center',
    'dealer',
    'Lone Star Auto Center',
    '281-355-5060',
    'https://www.lonestarautocenter.com',
    30.0771,
    -95.4305,
    '21602 North Fwy, Spring, TX 77373',
    '2026-08-29T00:00:00.000Z',
    '2026-08-29T00:00:00.000Z'
  ),
  (
    'seller-spring-motors',
    'dealer',
    'Spring Motors',
    '281-377-9946',
    'https://www.spring-motors.com',
    30.0669,
    -95.4407,
    '20819 Sunshine Lane, Spring, TX 77388',
    '2026-08-29T00:00:00.000Z',
    '2026-08-29T00:00:00.000Z'
  ),
  (
    'seller-essence-autos',
    'dealer',
    'Essence Autos',
    NULL,
    'https://www.essenceautostx.com',
    30.0596,
    -95.4616,
    '3102 Louetta Rd, Spring, TX 77388',
    '2026-08-29T00:00:00.000Z',
    '2026-08-29T00:00:00.000Z'
  ),
  (
    'seller-bay-motors',
    'dealer',
    'Bay Motors',
    '936-447-1110',
    'https://www.baymotorstx.com',
    30.1079,
    -95.6374,
    '30210 TX-249, Tomball, TX 77375',
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
VALUES
  (
    'feed-dealer-car-search-texans-auto-group',
    'seller-texans-auto-group',
    'Texans Auto Group',
    'dealer-car-search',
    'structured-web',
    'paused',
    'https://texansautogroup.com/inventory?clearall=1',
    'https://texansautogroup.com',
    130,
    'Spring Dealer Car Search source candidate; review live parser quality before enabling.',
    '2026-08-29T00:00:00.000Z',
    '2026-08-29T00:00:00.000Z'
  ),
  (
    'feed-dealer-car-search-lone-star-auto-center',
    'seller-lone-star-auto-center',
    'Lone Star Auto Center',
    'dealer-car-search',
    'structured-web',
    'paused',
    'https://www.lonestarautocenter.com/inventory?clearall=1',
    'https://www.lonestarautocenter.com',
    135,
    'Spring Dealer Car Search source candidate; review live parser quality before enabling.',
    '2026-08-29T00:00:00.000Z',
    '2026-08-29T00:00:00.000Z'
  ),
  (
    'feed-dealer-car-search-spring-motors',
    'seller-spring-motors',
    'Spring Motors',
    'dealer-car-search',
    'structured-web',
    'paused',
    'https://www.spring-motors.com/inventory?clearall=1',
    'https://www.spring-motors.com',
    140,
    'Spring Dealer Car Search source candidate; review live parser quality before enabling.',
    '2026-08-29T00:00:00.000Z',
    '2026-08-29T00:00:00.000Z'
  ),
  (
    'feed-carsforsale-essence-autos',
    'seller-essence-autos',
    'Essence Autos on Carsforsale',
    'carsforsale',
    'structured-web',
    'paused',
    'https://www.essenceautostx.com/cars-for-sale',
    'https://www.essenceautostx.com',
    145,
    'Spring Carsforsale-powered source candidate with family-relevant makes/models.',
    '2026-08-29T00:00:00.000Z',
    '2026-08-29T00:00:00.000Z'
  ),
  (
    'feed-carsforsale-bay-motors',
    'seller-bay-motors',
    'Bay Motors on Carsforsale',
    'carsforsale',
    'structured-web',
    'paused',
    'https://www.baymotorstx.com/cars-for-sale',
    'https://www.baymotorstx.com',
    150,
    'South Tomball Carsforsale-powered source candidate; small inventory useful for adapter validation.',
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
