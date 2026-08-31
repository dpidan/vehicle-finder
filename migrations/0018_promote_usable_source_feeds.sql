UPDATE source_feeds
SET
  status = 'active',
  notes = 'Promoted for usable-soon coverage after standalone collector smoke tests returned structured candidate data; continue watching saved-search match quality.',
  updated_at = '2026-08-31T00:00:00.000Z'
WHERE id IN (
  'feed-cargurus-toyo-financial-group',
  'feed-cargurus-vsa-motorcars',
  'feed-mynextride-auto-land-of-texas',
  'feed-gotgoodcars-uptown-imports',
  'feed-gotgoodcars-crown-auto'
);
