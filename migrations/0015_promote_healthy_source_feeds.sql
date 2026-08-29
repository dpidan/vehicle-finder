UPDATE source_feeds
SET
  status = 'active',
  notes = 'Promoted after Worker preview returned 25 VIN-backed Dealer Car Search candidates.',
  updated_at = '2026-08-29T00:00:00.000Z'
WHERE id IN (
  'feed-dealer-car-search-texans-auto-group',
  'feed-dealer-car-search-lone-star-auto-center'
);
