-- REOVANA listings schema
-- Run against Supabase Postgres (direct connection or SQL editor)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS listing_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  source_url TEXT,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES listing_sources(id) ON DELETE RESTRICT,
  category TEXT NOT NULL,
  external_id TEXT,

  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state CHAR(2) NOT NULL DEFAULT '',
  zip TEXT NOT NULL DEFAULT '',
  county TEXT,

  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  price_label TEXT NOT NULL DEFAULT 'List Price',
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms NUMERIC(4, 1) NOT NULL DEFAULT 0,
  square_footage INTEGER NOT NULL DEFAULT 0,
  lot_size NUMERIC(12, 2),
  year_built TEXT,
  property_type TEXT,
  status TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',

  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,

  image_url TEXT,
  detail_url TEXT,
  source_agency TEXT,

  is_new BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_source_id ON listings(source_id);
CREATE INDEX IF NOT EXISTS idx_listings_state ON listings(state);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price DESC);
CREATE INDEX IF NOT EXISTS idx_listings_active_category ON listings(category, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_listings_metadata ON listings USING GIN (metadata);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listings_updated_at ON listings;
CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS listing_sources_updated_at ON listing_sources;
CREATE TRIGGER listing_sources_updated_at
  BEFORE UPDATE ON listing_sources
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

ALTER TABLE listing_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read listing_sources" ON listing_sources;
CREATE POLICY "Public read listing_sources"
  ON listing_sources FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Public read active listings" ON listings;
CREATE POLICY "Public read active listings"
  ON listings FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

INSERT INTO listing_sources (id, name, source_url) VALUES
  ('hud', 'HUD HomeStore', 'https://www.hudhomestore.gov'),
  ('vrm', 'VRM Properties (VA REO)', 'https://www.vrmproperties.com'),
  ('homesteps', 'Freddie Mac HomeSteps', 'https://www.homesteps.com'),
  ('gsa-sales', 'GSA Real Estate Sales', 'https://www.realestatesales.gov'),
  ('gsa-dispositions', 'GSA Accelerated Dispositions', 'https://www.gsa.gov/real-estate/real-property-disposition/assets-identified-for-accelerated-disposition'),
  ('usda', 'USDA Rural Development', 'https://properties.sc.egov.usda.gov'),
  ('mock', 'REOVANA Placeholder', NULL)
ON CONFLICT (id) DO NOTHING;
