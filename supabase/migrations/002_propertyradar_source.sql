-- PropertyRadar distressed-property feed (Excel import; images deferred)

INSERT INTO listing_sources (id, name, source_url) VALUES
  ('propertyradar', 'PropertyRadar', 'https://www.propertyradar.com')
ON CONFLICT (id) DO NOTHING;
