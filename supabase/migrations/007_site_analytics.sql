-- Site activity analytics (page views, visitors, key actions)
-- Inserts only via server (DATABASE_URL / service role). No public RLS write.

CREATE TABLE IF NOT EXISTS site_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_name TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '/',
  referrer TEXT,
  session_id TEXT NOT NULL DEFAULT '',
  visitor_id TEXT NOT NULL DEFAULT '',
  user_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_site_analytics_created_at
  ON site_analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_analytics_event_created
  ON site_analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_analytics_path_created
  ON site_analytics_events (path, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_site_analytics_session
  ON site_analytics_events (session_id);

CREATE INDEX IF NOT EXISTS idx_site_analytics_visitor_created
  ON site_analytics_events (visitor_id, created_at DESC);

ALTER TABLE site_analytics_events ENABLE ROW LEVEL SECURITY;

-- Intentionally no policies for anon/authenticated — API uses direct Postgres / service role.
