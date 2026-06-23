-- Track listings missing photos for imports and admin queries.
-- Query missing images: SELECT * FROM listings WHERE has_image = false AND is_active = true;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS has_image boolean
  GENERATED ALWAYS AS (
    image_url IS NOT NULL AND btrim(image_url) <> ''
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_listings_missing_image
  ON listings (source_id, category)
  WHERE has_image = false AND is_active = true;
