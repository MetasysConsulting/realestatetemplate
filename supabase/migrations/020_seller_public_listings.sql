-- Publish FSBO / seller listings into public `listings` inventory (source_id = seller)

INSERT INTO listing_sources (id, name, source_url)
VALUES (
  'seller',
  'REOVANA Seller Listings',
  'https://www.reovana.com/sell'
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();
