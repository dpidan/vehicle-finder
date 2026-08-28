SELECT COUNT(*) AS users FROM users;
SELECT COUNT(*) AS saved_searches FROM saved_searches;
SELECT COUNT(*) AS vehicles FROM vehicles;
SELECT COUNT(*) AS sellers FROM sellers;
SELECT COUNT(*) AS listings FROM listings;
SELECT COUNT(*) AS listing_snapshots FROM listing_snapshots;
SELECT COUNT(*) AS search_evaluations FROM search_evaluations;
SELECT COUNT(*) AS listing_dispositions FROM listing_dispositions;
SELECT COUNT(*) AS model_year_risks FROM model_year_risks;
SELECT COUNT(*) AS vin_decodes FROM vin_decodes;
SELECT COUNT(*) AS vehicle_recalls FROM vehicle_recalls;

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
