SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'saved_searches', COUNT(*) FROM saved_searches
UNION ALL SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL SELECT 'sellers', COUNT(*) FROM sellers
UNION ALL SELECT 'listings', COUNT(*) FROM listings
UNION ALL SELECT 'listing_snapshots', COUNT(*) FROM listing_snapshots
UNION ALL SELECT 'search_evaluations', COUNT(*) FROM search_evaluations
UNION ALL SELECT 'listing_dispositions', COUNT(*) FROM listing_dispositions
UNION ALL SELECT 'model_year_risks', COUNT(*) FROM model_year_risks
UNION ALL SELECT 'vin_decodes', COUNT(*) FROM vin_decodes
UNION ALL SELECT 'vehicle_recalls', COUNT(*) FROM vehicle_recalls;

SELECT
  l.id AS listing_id,
  v.vin,
  v.year,
  v.make,
  v.model,
  l.price_amount,
  l.mileage,
  COUNT(s.id) AS snapshot_count
FROM listings l
JOIN vehicles v ON v.id = l.vehicle_id
LEFT JOIN listing_snapshots s ON s.listing_id = l.id
GROUP BY l.id, v.vin, v.year, v.make, v.model, l.price_amount, l.mileage
ORDER BY l.updated_at DESC
LIMIT 20;

SELECT
  se.saved_search_id,
  COUNT(*) AS evaluation_count,
  ROUND(MAX(se.deal_score), 1) AS best_deal_score,
  ROUND(MAX(se.vehicle_score), 1) AS best_vehicle_score,
  MAX(se.evaluated_at) AS latest_evaluated_at
FROM search_evaluations se
GROUP BY se.saved_search_id;
