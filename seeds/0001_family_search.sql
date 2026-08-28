INSERT INTO users (id, email, display_name, locale, created_at)
VALUES (
  'family',
  NULL,
  'Family',
  'en-US',
  '2026-08-25T00:00:00.000Z'
)
ON CONFLICT(id) DO UPDATE SET
  email = excluded.email,
  display_name = excluded.display_name,
  locale = excluded.locale;

INSERT INTO saved_searches (
  id,
  user_id,
  name,
  enabled,
  config_json,
  created_at,
  updated_at
)
VALUES (
  'family-replacement-vehicle',
  'family',
  'Family replacement vehicle',
  1,
  '{"schemaVersion":1,"id":"family-replacement-vehicle","userId":"family","name":"Family replacement vehicle","enabled":true,"geography":{"center":{"label":"Happy Ln, Cypress, TX","latitude":29.9691,"longitude":-95.6972},"radiusMiles":25},"budgets":{"cashTarget":10000,"stretchTarget":15000,"absoluteMax":17000},"filters":{"makes":["Honda","Toyota","Ford"],"models":["Odyssey","Pilot","Sienna","Highlander","CR-V","Edge","Explorer"],"excludedExteriorColors":["black"],"minSeats":5,"titleStatuses":["clean"],"sellerTypes":["dealer","private"],"excludeNonRunning":true,"excludeUnresolvedMajorSafetyIssues":true},"preferences":{"vehicleTypeWeights":{"minivan":1,"three-row-suv":0.9,"two-row-suv":0.7,"sedan":0},"modelPreferences":[{"make":"Honda","model":"Odyssey","level":"primary","weight":1},{"make":"Honda","model":"Pilot","level":"primary","weight":1},{"make":"Toyota","model":"Sienna","level":"primary","weight":0.95},{"make":"Toyota","model":"Highlander","level":"primary","weight":0.95},{"make":"Honda","model":"CR-V","level":"secondary","weight":0.7},{"make":"Ford","model":"Explorer","level":"secondary","weight":0.6},{"make":"Ford","model":"Edge","level":"secondary","weight":0.5}],"mileageTargets":{"cashIdealMax":120000,"cashSoftMax":140000,"stretchIdealMax":100000,"stretchSoftMax":120000},"colorPreferences":{"preferredExteriorColors":["white","silver","light gray"],"avoidExteriorColors":["black","dark blue","dark gray"],"reason":"reduce cabin heat"}},"scoring":{"vehicleWeights":{"reliabilityModelYearRisk":25,"maintenanceServiceHistory":20,"mileageRelativeToAge":15,"titleAccidentOwnershipHistory":15,"mechanicalPhysicalCondition":10,"familyVehicleRoleFit":10,"trimUsefulFeatures":5},"dealWeights":{"priceVsComparableListings":30,"effectivePurchaseCost":20,"vehicleScoreContribution":20,"priceVsSavedSearchBudget":10,"listingAgePriceMovement":8,"sellerConfidence":5,"distance":4,"listingCompletenessTransparency":3},"riskTolerance":"low"},"notifications":{"minimumVehicleScore":70,"minimumDealScore":75,"notifyOnNewListing":true,"notifyOnPriceDrop":true,"minimumPriceDrop":500},"workflow":{"purchaseDeadline":"2026-09-14","willingToTravelBeyondRadius":true,"privatePartyAllowed":true,"financingPreference":"acceptable","preferredInspectionProviderId":"corbs-auto-grand-rd-cypress-tx","immediateMaintenanceBudget":800}}',
  '2026-08-25T00:00:00.000Z',
  '2026-08-25T00:00:00.000Z'
)
ON CONFLICT(id) DO UPDATE SET
  user_id = excluded.user_id,
  name = excluded.name,
  enabled = excluded.enabled,
  config_json = excluded.config_json,
  updated_at = excluded.updated_at;

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
    'seller-trade-lane-motors',
    'dealer',
    'Trade Lane Motors',
    NULL,
    'https://www.tradelanemotors.com',
    29.9697,
    -95.697,
    'Cypress, TX',
    '2026-08-28T00:00:00.000Z',
    '2026-08-28T00:00:00.000Z'
  ),
  (
    'seller-king-queen-auto',
    'dealer',
    'Mr. King and Mrs. Queens Auto Finance LLC',
    NULL,
    'https://www.kingqueenauto.com',
    29.9476,
    -95.5843,
    '11830 Jones Road, Houston, TX 77070',
    '2026-08-28T00:00:00.000Z',
    '2026-08-28T00:00:00.000Z'
  ),
  (
    'seller-toyo-financial-group',
    'dealer',
    'Toyo Financial Group',
    NULL,
    'https://www.toyofg.com',
    29.935,
    -95.6469,
    '22226 Northwest Fwy, Cypress, TX 77429',
    '2026-08-28T00:00:00.000Z',
    '2026-08-28T00:00:00.000Z'
  ),
  (
    'seller-vsa-motorcars',
    'dealer',
    'VSA Motorcars',
    NULL,
    'https://www.vsamotorcars.com',
    29.9809,
    -95.655,
    '12212 Cypress N. Houston RD #1, Cypress, TX 77429',
    '2026-08-28T00:00:00.000Z',
    '2026-08-28T00:00:00.000Z'
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

INSERT INTO model_year_risks (
  id,
  make,
  model,
  year_start,
  year_end,
  rating,
  trim_json,
  engine_json,
  transmission_json,
  issue,
  category,
  severity,
  inspect_for_json,
  remediation_json,
  evidence_ids_json
)
VALUES
  (
    'risk-honda-odyssey-2011-2013-vcm',
    'Honda',
    'Odyssey',
    2011,
    2013,
    'caution',
    NULL,
    NULL,
    NULL,
    'VCM, misfire, piston-ring, sliding-door, and timing-belt history should be verified.',
    'engine',
    7,
    '["Ask for timing-belt service records","Verify misfire or oil-consumption history","Test power sliding doors"]',
    NULL,
    '[]'
  ),
  (
    'risk-honda-pilot-2012-2013-vcm',
    'Honda',
    'Pilot',
    2012,
    2013,
    'caution',
    NULL,
    NULL,
    NULL,
    'Piston-ring, misfire, oil-consumption, and torque-converter behavior should be verified.',
    'engine',
    7,
    '["Ask for oil-consumption or misfire repair history","Check transmission behavior on test drive","Verify timing-belt service"]',
    NULL,
    '[]'
  ),
  (
    'risk-toyota-sienna-2015-2016-sliding-doors',
    'Toyota',
    'Sienna',
    2015,
    2016,
    'preferred',
    NULL,
    NULL,
    NULL,
    'Generally preferred years, with power sliding-door operation still worth checking.',
    'body',
    3,
    '["Test both power sliding doors","Check door cable and latch operation","Verify maintenance records"]',
    NULL,
    '[]'
  )
ON CONFLICT(id) DO UPDATE SET
  make = excluded.make,
  model = excluded.model,
  year_start = excluded.year_start,
  year_end = excluded.year_end,
  rating = excluded.rating,
  trim_json = excluded.trim_json,
  engine_json = excluded.engine_json,
  transmission_json = excluded.transmission_json,
  issue = excluded.issue,
  category = excluded.category,
  severity = excluded.severity,
  inspect_for_json = excluded.inspect_for_json,
  remediation_json = excluded.remediation_json,
  evidence_ids_json = excluded.evidence_ids_json;

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
    'feed-dealer-car-search-trade-lane-motors',
    'seller-trade-lane-motors',
    'Trade Lane Motors',
    'dealer-car-search',
    'structured-web',
    'active',
    'https://www.tradelanemotors.com/newandusedcars?clearall=1',
    'https://www.tradelanemotors.com',
    10,
    'Healthy plain-fetch Dealer Car Search seed near the family search area.',
    '2026-08-28T00:00:00.000Z',
    '2026-08-28T00:00:00.000Z'
  ),
  (
    'feed-dealer-car-search-king-queen-auto',
    'seller-king-queen-auto',
    'Mr. King and Mrs. Queens Auto Finance LLC',
    'dealer-car-search',
    'structured-web',
    'active',
    'https://www.kingqueenauto.com/newandusedcars?clearall=1',
    'https://www.kingqueenauto.com',
    20,
    'Healthy plain-fetch Dealer Car Search seed; contributes detail URLs and prices.',
    '2026-08-28T00:00:00.000Z',
    '2026-08-28T00:00:00.000Z'
  ),
  (
    'feed-cargurus-toyo-financial-group',
    'seller-toyo-financial-group',
    'Toyo Financial Group on CarGurus',
    'cargurus',
    'structured-web',
    'paused',
    'https://www.cargurus.com/Cars/m-Toyo-Financial-Group-sp357911',
    'https://www.toyofg.com',
    100,
    'Standalone adapter-development feed; review dedupe and terms before scheduled refresh.',
    '2026-08-28T00:00:00.000Z',
    '2026-08-28T00:00:00.000Z'
  ),
  (
    'feed-cargurus-vsa-motorcars',
    'seller-vsa-motorcars',
    'VSA Motorcars on CarGurus',
    'cargurus',
    'structured-web',
    'paused',
    'https://www.cargurus.com/Cars/m-VSA-Motorcars-sp354407',
    'https://www.vsamotorcars.com',
    110,
    'Standalone adapter-development feed because dealer-owned VSA pages returned HTTP 403 to plain fetch.',
    '2026-08-28T00:00:00.000Z',
    '2026-08-28T00:00:00.000Z'
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
