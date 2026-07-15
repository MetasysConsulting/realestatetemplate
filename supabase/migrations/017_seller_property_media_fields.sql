-- Expand seller_properties for fuller Add Property form + media/map.

ALTER TABLE seller_properties
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS property_type TEXT,
  ADD COLUMN IF NOT EXISTS listing_status TEXT,
  ADD COLUMN IF NOT EXISTS year_built INTEGER,
  ADD COLUMN IF NOT EXISTS lot_size NUMERIC,
  ADD COLUMN IF NOT EXISTS garage NUMERIC,
  ADD COLUMN IF NOT EXISTS county TEXT,
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT,
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS image_urls JSONB NOT NULL DEFAULT '[]'::JSONB;

COMMENT ON COLUMN seller_properties.image_urls IS
  'Public URLs for seller-uploaded photos (listing-images/seller/{userId}/...).';

-- Allow authenticated sellers to upload under seller/{their-user-id}/…
DROP POLICY IF EXISTS "Sellers upload own listing images" ON storage.objects;
CREATE POLICY "Sellers upload own listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'seller'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Sellers update own listing images" ON storage.objects;
CREATE POLICY "Sellers update own listing images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'seller'
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'seller'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Sellers delete own listing images" ON storage.objects;
CREATE POLICY "Sellers delete own listing images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'seller'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
